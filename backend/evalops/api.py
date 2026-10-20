"""EvalOps REST API with authentication, workspace authorization, secrets protection, and hardened security."""
import logging
import os
import time
from datetime import datetime, timezone, timedelta
from urllib.request import Request as URLRequest, urlopen
from urllib.error import HTTPError, URLError

from fastapi import FastAPI, Depends, HTTPException, Response, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select, desc, text

from .db import Base, engine, get_db
from . import models as m, schemas as s
from .engine import evaluate_cases, RunStatus, TestStatus, RegressionStatus
from .config import settings
from .security import (
    hash_password,
    verify_password,
    generate_session_token,
    hash_session_token,
    encrypt_secret,
    decrypt_secret,
    mask_secret,
    validate_and_normalize_email,
    rate_limiter,
)

logger = logging.getLogger("evalops.api")

# Dev convenience: creates tables if they do not exist; production uses Alembic migrations
if settings.environment != "production":
    Base.metadata.create_all(bind=engine)
    from .db import ensure_schema_upgrades
    ensure_schema_upgrades(engine)

app = FastAPI(
    title=settings.api_title,
    version="1.0.0",
    description="Deterministic LLM evaluation, authentication, and regression gate API",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS setup: allows explicit origins, local development, and Vercel deployments (*.vercel.app)
allowed_origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"^(https?://(localhost|127\.0\.0\.1)(:\d+)?|https://.*\.vercel\.app)$",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
)


# Security Headers & Request Body Size Limit Middleware
@app.middleware("http")
async def security_middleware(request: Request, call_next):
    # Enforce request body size limit (5MB max)
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > 5 * 1024 * 1024:
        return JSONResponse(status_code=413, content={"detail": "Request body too large (maximum 5MB allowed)"})

    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    if settings.session_cookie_secure:
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response


# Global Exception Handler to avoid leaking internal stack traces in production
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    if isinstance(exc, HTTPException):
        return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail}, headers=exc.headers)
    logger.error("Unhandled API exception on %s %s: %s", request.method, request.url.path, exc)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred. Please try again later."},
    )


def utcnow():
    return datetime.now(timezone.utc)


# Authentication Dependency
def get_current_user(request: Request, db: Session = Depends(get_db)) -> m.User:
    """Extract and validate bearer token or HttpOnly session cookie."""
    token = None
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header[len("Bearer ") :].strip()
    elif settings.session_cookie_name in request.cookies:
        token = request.cookies[settings.session_cookie_name].strip()

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token_hash = hash_session_token(token)
    session = db.scalar(
        select(m.UserSession)
        .options(joinedload(m.UserSession.user))
        .where(
            m.UserSession.token_hash == token_hash,
            m.UserSession.revoked == False,
        )
    )

    if not session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or revoked session",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check expiration
    expires_at = session.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < utcnow():
        session.revoked = True
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return session.user


def _set_session_cookie(response: Response, token: str, expires_at: datetime):
    max_age = int((expires_at - utcnow()).total_seconds())
    response.set_cookie(
        key=settings.session_cookie_name,
        value=token,
        max_age=max(0, max_age),
        expires=expires_at,
        httponly=True,
        secure=settings.session_cookie_secure,
        samesite=settings.session_cookie_samesite,
        path="/",
    )


# Authorization Helper: verifies project ownership
def _project(db: Session, project_id: int, user: m.User) -> m.Project:
    project = db.get(m.Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    # If project was created before multi-user auth and is unassigned, assign to this user
    if project.user_id is None:
        project.user_id = user.id
        db.commit()
        db.refresh(project)
    elif project.user_id != user.id:
        raise HTTPException(status_code=403, detail="You do not have permission to access this project")
    return project


def _case(db: Session, case_id: int, user: m.User) -> m.TestCase:
    case = db.get(m.TestCase, case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Test case not found")
    _project(db, case.project_id, user)
    return case


def _run(db: Session, run_id: int, user: m.User) -> m.EvaluationRun:
    run = db.get(m.EvaluationRun, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    _project(db, run.project_id, user)
    return run


# -------------------------------------------------------------
# Public & Health Endpoints
# -------------------------------------------------------------
@app.get("/")
def root():
    return {
        "status": "ok",
        "service": "evalops-api",
        "version": app.version,
        "environment": settings.environment,
        "health": "/api/v1/health",
        "docs": "/docs",
        "openapi": "/openapi.json",
    }


@app.get("/api/v1/health")
def health(db: Session = Depends(get_db)):
    db_status = "connected"
    try:
        db.execute(text("SELECT 1"))
    except Exception as exc:
        db_status = f"error: {str(exc)}"
    return {
        "status": "ok",
        "service": "evalops-api",
        "version": app.version,
        "environment": settings.environment,
        "database": db_status,
    }


# -------------------------------------------------------------
# Authentication Endpoints
# -------------------------------------------------------------
@app.post("/api/v1/auth/register", response_model=s.AuthResponse, status_code=201)
def register(payload: s.UserRegister, request: Request, response: Response, db: Session = Depends(get_db)):
    client_ip = request.client.host if request.client else "unknown"
    is_limited, retry_after = rate_limiter.is_limited(f"register:{client_ip}", max_attempts=15, window_seconds=60)
    if is_limited:
        raise HTTPException(
            status_code=429,
            detail=f"Too many registration attempts. Please try again in {retry_after} seconds.",
            headers={"Retry-After": str(retry_after)},
        )

    try:
        norm_email = validate_and_normalize_email(payload.email)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))

    existing = db.scalar(select(m.User).where(m.User.email == norm_email))
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email address already exists")

    hashed = hash_password(payload.password)
    user = m.User(
        email=norm_email,
        hashed_password=hashed,
        full_name=payload.full_name.strip() if payload.full_name else "",
    )
    db.add(user)
    db.flush()

    # Legacy data migration: if there are existing unassigned projects, assign them to the first user
    unassigned = db.scalars(select(m.Project).where(m.Project.user_id == None)).all()
    for p in unassigned:
        p.user_id = user.id

    token = generate_session_token()
    token_hash = hash_session_token(token)
    expires_at = utcnow() + timedelta(days=settings.session_expire_days)
    session = m.UserSession(user_id=user.id, token_hash=token_hash, expires_at=expires_at)
    db.add(session)
    db.add(m.AuditEvent(event_type="user_registered", user_id=user.id, details={"email": norm_email}))
    db.commit()
    db.refresh(user)

    _set_session_cookie(response, token, expires_at)
    return {"user": user, "token": token, "expires_at": expires_at}


@app.post("/api/v1/auth/login", response_model=s.AuthResponse)
def login(payload: s.UserLogin, request: Request, response: Response, db: Session = Depends(get_db)):
    client_ip = request.client.host if request.client else "unknown"
    is_limited, retry_after = rate_limiter.is_limited(f"login:{client_ip}", max_attempts=settings.rate_limit_auth_per_min, window_seconds=60)
    if is_limited:
        raise HTTPException(
            status_code=429,
            detail=f"Too many failed login attempts. Please try again in {retry_after} seconds.",
            headers={"Retry-After": str(retry_after)},
        )

    try:
        norm_email = validate_and_normalize_email(payload.email)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user = db.scalar(select(m.User).where(m.User.email == norm_email))
    if not user or not verify_password(payload.password, user.hashed_password):
        # Generic error message: never reveal whether account exists
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = generate_session_token()
    token_hash = hash_session_token(token)
    expires_at = utcnow() + timedelta(days=settings.session_expire_days)
    session = m.UserSession(user_id=user.id, token_hash=token_hash, expires_at=expires_at)
    db.add(session)
    db.add(m.AuditEvent(event_type="user_logged_in", user_id=user.id, details={"ip": client_ip}))
    db.commit()
    db.refresh(user)

    _set_session_cookie(response, token, expires_at)
    return {"user": user, "token": token, "expires_at": expires_at}


@app.post("/api/v1/auth/logout")
def logout(request: Request, response: Response, current_user: m.User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Invalidate session token
    token = None
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header[len("Bearer ") :].strip()
    elif settings.session_cookie_name in request.cookies:
        token = request.cookies[settings.session_cookie_name].strip()

    if token:
        token_hash = hash_session_token(token)
        session = db.scalar(select(m.UserSession).where(m.UserSession.token_hash == token_hash))
        if session:
            session.revoked = True
            db.commit()

    response.delete_cookie(key=settings.session_cookie_name, path="/")
    return {"success": True, "message": "Successfully logged out"}


@app.get("/api/v1/auth/me", response_model=s.UserOut)
def get_me(current_user: m.User = Depends(get_current_user)):
    return current_user


@app.patch("/api/v1/auth/me", response_model=s.UserOut)
def update_me(payload: s.UserUpdate, current_user: m.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if payload.full_name is not None:
        current_user.full_name = payload.full_name.strip()

    if payload.new_password:
        if not payload.current_password or not verify_password(payload.current_password, current_user.hashed_password):
            raise HTTPException(status_code=400, detail="Current password verification failed")
        current_user.hashed_password = hash_password(payload.new_password)

    db.commit()
    db.refresh(current_user)
    return current_user


@app.delete("/api/v1/auth/me")
def delete_my_account(
    response: Response,
    current_user: m.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Permanently delete user account and all owned resources."""
    user_id = current_user.id
    db.delete(current_user)
    db.commit()
    response.delete_cookie(key=settings.session_cookie_name, path="/")
    return {"deleted": True, "user_id": user_id, "message": "Account and all associated resources permanently deleted"}


# -------------------------------------------------------------
# Integrations Endpoints (Opt-in External Provider)
# -------------------------------------------------------------
@app.get("/api/v1/integrations", response_model=list[s.IntegrationOut])
def list_integrations(current_user: m.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.scalars(
        select(m.UserIntegration)
        .where(m.UserIntegration.user_id == current_user.id)
        .order_by(desc(m.UserIntegration.created_at))
    ).all()


@app.post("/api/v1/integrations", response_model=s.IntegrationOut, status_code=201)
def create_integration(
    payload: s.IntegrationCreate,
    current_user: m.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Validate endpoint
    base = payload.api_base.strip().rstrip("/")
    if not (base.startswith("http://") or base.startswith("https://")):
        raise HTTPException(status_code=422, detail="API Base URL must start with http:// or https://")

    # Encrypt secret
    encrypted = encrypt_secret(payload.api_key.strip())
    masked = mask_secret(payload.api_key.strip())

    integration = m.UserIntegration(
        user_id=current_user.id,
        provider=payload.provider,
        api_base=base,
        encrypted_api_key=encrypted,
        masked_key=masked,
        model_name=payload.model_name.strip(),
        is_enabled=payload.is_enabled,
        data_disclosure_acknowledged=payload.data_disclosure_acknowledged,
        timeout_seconds=payload.timeout_seconds,
    )
    db.add(integration)
    db.add(
        m.AuditEvent(
            event_type="integration_created",
            user_id=current_user.id,
            details={"provider": payload.provider, "api_base": base, "model": payload.model_name},
        )
    )
    db.commit()
    db.refresh(integration)
    return integration


@app.patch("/api/v1/integrations/{integration_id}", response_model=s.IntegrationOut)
def update_integration(
    integration_id: int,
    payload: s.IntegrationUpdate,
    current_user: m.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    integ = db.get(m.UserIntegration, integration_id)
    if not integ or integ.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Integration not found")

    if payload.api_base is not None:
        base = payload.api_base.strip().rstrip("/")
        if not (base.startswith("http://") or base.startswith("https://")):
            raise HTTPException(status_code=422, detail="API Base URL must start with http:// or https://")
        integ.api_base = base

    if payload.api_key is not None and payload.api_key.strip():
        integ.encrypted_api_key = encrypt_secret(payload.api_key.strip())
        integ.masked_key = mask_secret(payload.api_key.strip())

    if payload.model_name is not None:
        integ.model_name = payload.model_name.strip()
    if payload.is_enabled is not None:
        integ.is_enabled = payload.is_enabled
    if payload.data_disclosure_acknowledged is not None:
        integ.data_disclosure_acknowledged = payload.data_disclosure_acknowledged
    if payload.timeout_seconds is not None:
        integ.timeout_seconds = payload.timeout_seconds

    integ.updated_at = utcnow()
    db.commit()
    db.refresh(integ)
    return integ


@app.delete("/api/v1/integrations/{integration_id}", status_code=204)
def delete_integration(
    integration_id: int,
    current_user: m.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    integ = db.get(m.UserIntegration, integration_id)
    if not integ or integ.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Integration not found")
    db.delete(integ)
    db.add(m.AuditEvent(event_type="integration_deleted", user_id=current_user.id, details={"integration_id": integration_id}))
    db.commit()
    return Response(status_code=204)


@app.post("/api/v1/integrations/{integration_id}/test", response_model=s.IntegrationTestResponse)
def test_integration(
    integration_id: int,
    request: Request,
    current_user: m.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    client_ip = request.client.host if request.client else "unknown"
    is_limited, retry_after = rate_limiter.is_limited(f"integ_test:{current_user.id}", max_attempts=5, window_seconds=60)
    if is_limited:
        raise HTTPException(status_code=429, detail=f"Please wait {retry_after}s before testing again.")

    integ = db.get(m.UserIntegration, integration_id)
    if not integ or integ.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Integration not found")

    raw_key = decrypt_secret(integ.encrypted_api_key)
    base = integ.api_base.rstrip("/")
    timeout = min(integ.timeout_seconds, 10.0)

    started = time.perf_counter()
    req = URLRequest(
        f"{base}/models",
        headers={"Authorization": f"Bearer {raw_key}", "User-Agent": "EvalOps/1.0"},
        method="GET",
    )
    try:
        with urlopen(req, timeout=timeout) as resp:
            # Read at most 64KB
            resp.read(65536)
        latency = (time.perf_counter() - started) * 1000
        return {"success": True, "message": "Connection successful (models endpoint responded)", "latency_ms": latency}
    except HTTPError as exc:
        latency = (time.perf_counter() - started) * 1000
        # Safe error without leaking credentials or internal headers
        return {"success": False, "message": f"Provider endpoint returned HTTP {exc.code}", "latency_ms": latency}
    except (URLError, TimeoutError) as exc:
        latency = (time.perf_counter() - started) * 1000
        return {"success": False, "message": f"Connection failed: {type(exc).__name__}", "latency_ms": latency}
    except Exception as exc:
        return {"success": False, "message": "Connection test failed unexpectedly"}


# -------------------------------------------------------------
# Projects Endpoints (Workspace Isolated)
# -------------------------------------------------------------
@app.get("/api/v1/projects", response_model=list[s.ProjectOut])
def list_projects(current_user: m.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.scalars(
        select(m.Project)
        .where(m.Project.user_id == current_user.id)
        .order_by(desc(m.Project.created_at))
    ).all()


@app.post("/api/v1/projects", response_model=s.ProjectOut, status_code=201)
def create_project(
    payload: s.ProjectCreate,
    current_user: m.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = m.Project(
        user_id=current_user.id,
        name=payload.name,
        description=payload.description,
        config=payload.config,
    )
    db.add(project)
    db.add(m.AuditEvent(event_type="project_created", user_id=current_user.id, details={"name": payload.name}))
    db.commit()
    db.refresh(project)
    return project


@app.get("/api/v1/projects/{project_id}", response_model=s.ProjectOut)
def get_project(project_id: int, current_user: m.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return _project(db, project_id, current_user)


@app.patch("/api/v1/projects/{project_id}", response_model=s.ProjectOut)
def update_project(
    project_id: int,
    payload: s.ProjectUpdate,
    current_user: m.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = _project(db, project_id, current_user)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(project, key, value)
    db.commit()
    db.refresh(project)
    return project


@app.delete("/api/v1/projects/{project_id}", status_code=204)
def delete_project(
    project_id: int,
    current_user: m.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = _project(db, project_id, current_user)
    db.query(m.AuditEvent).filter(m.AuditEvent.project_id == project_id).delete(synchronize_session=False)
    db.delete(project)
    db.commit()
    return Response(status_code=204)


# -------------------------------------------------------------
# Test Cases Endpoints
# -------------------------------------------------------------
@app.get("/api/v1/test-cases", response_model=list[s.TestCaseOut])
def list_all_test_cases(
    project_id: int | None = None,
    current_user: m.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    stmt = (
        select(m.TestCase)
        .join(m.Project)
        .where(m.Project.user_id == current_user.id)
        .order_by(m.TestCase.project_id, m.TestCase.id)
    )
    if project_id is not None:
        _project(db, project_id, current_user)
        stmt = stmt.where(m.TestCase.project_id == project_id)
    return db.scalars(stmt).all()


@app.get("/api/v1/projects/{project_id}/test-cases", response_model=list[s.TestCaseOut])
def list_cases(
    project_id: int,
    current_user: m.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _project(db, project_id, current_user)
    return db.scalars(
        select(m.TestCase).where(m.TestCase.project_id == project_id).order_by(m.TestCase.id)
    ).all()


@app.post("/api/v1/projects/{project_id}/test-cases", response_model=s.TestCaseOut, status_code=201)
def create_case(
    project_id: int,
    payload: s.TestCaseCreate,
    current_user: m.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _project(db, project_id, current_user)
    case = m.TestCase(project_id=project_id, **payload.model_dump())
    db.add(case)
    db.commit()
    db.refresh(case)
    return case


@app.patch("/api/v1/test-cases/{case_id}", response_model=s.TestCaseOut)
def update_case(
    case_id: int,
    payload: s.TestCaseUpdate,
    current_user: m.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    case = _case(db, case_id, current_user)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(case, key, value)
    db.commit()
    db.refresh(case)
    return case


@app.delete("/api/v1/test-cases/{case_id}", status_code=204)
def delete_case(
    case_id: int,
    current_user: m.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    case = _case(db, case_id, current_user)
    db.delete(case)
    db.commit()
    return Response(status_code=204)


# -------------------------------------------------------------
# Evaluation Runs & Results Endpoints
# -------------------------------------------------------------
@app.get("/api/v1/runs", response_model=list[s.RunOut])
def list_runs(
    project_id: int | None = None,
    limit: int = 50,
    current_user: m.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Only return runs belonging to the user's projects
    stmt = (
        select(m.EvaluationRun)
        .join(m.Project)
        .where(m.Project.user_id == current_user.id)
        .order_by(desc(m.EvaluationRun.created_at))
        .limit(min(max(limit, 1), 200))
    )
    if project_id is not None:
        _project(db, project_id, current_user)
        stmt = stmt.where(m.EvaluationRun.project_id == project_id)
    return db.scalars(stmt).all()


@app.post("/api/v1/projects/{project_id}/runs", response_model=s.RunOut, status_code=201)
def create_run(
    project_id: int,
    payload: s.RunCreate,
    current_user: m.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = _project(db, project_id, current_user)
    cases = db.scalars(
        select(m.TestCase).where(m.TestCase.project_id == project_id).order_by(m.TestCase.id)
    ).all()
    if not cases:
        raise HTTPException(422, "Cannot run evaluation: project has no test cases")

    baseline_results = {}
    if payload.baseline_run_id:
        baseline_run = db.get(m.EvaluationRun, payload.baseline_run_id)
        if not baseline_run or baseline_run.project_id != project_id:
            raise HTTPException(422, "Baseline run must belong to this project")
        for r in baseline_run.results:
            baseline_results[str(r.test_case_id or r.test_name)] = {
                "passed": r.passed,
                "latency_ms": r.latency_ms,
            }

    case_dicts = [
        {
            "id": c.id,
            "name": c.name,
            "input_text": c.input_text,
            "expected_output": c.expected_output,
            "criteria": c.criteria,
            "latency_ms": (payload.latencies_ms or {}).get(str(c.id)),
        }
        for c in cases
    ]

    output_map = payload.outputs
    if output_map is None:
        output_map = project.config.get("outputs")

    result = evaluate_cases(
        case_dicts,
        outputs=output_map,
        baseline=baseline_results,
        gate_config=project.config.get("gate", {}),
    )

    run = m.EvaluationRun(
        project_id=project_id,
        status=result["status"],
        trigger=payload.trigger,
        revision=payload.revision,
        baseline_run_id=payload.baseline_run_id,
        total=result["total"],
        passed=result["passed"],
        failed=result["failed"],
        duration_ms=result["duration_ms"],
        gate_passed=result["gate_passed"],
        gate_reasons=result["gate_reasons"],
    )
    db.add(run)
    db.flush()

    for item in result["results"]:
        db.add(m.TestResult(run_id=run.id, **item))

    db.add(
        m.AuditEvent(
            event_type="evaluation_run_created",
            user_id=current_user.id,
            project_id=project_id,
            details={
                "run_id": run.id,
                "trigger": payload.trigger,
                "status": run.status,
                "gate_passed": run.gate_passed,
            },
        )
    )
    db.commit()
    db.refresh(run)
    return run


@app.get("/api/v1/runs/{run_id}", response_model=s.RunOut)
def get_run(run_id: int, current_user: m.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return _run(db, run_id, current_user)


@app.delete("/api/v1/runs/{run_id}", status_code=204)
def delete_run(run_id: int, current_user: m.User = Depends(get_current_user), db: Session = Depends(get_db)):
    run = _run(db, run_id, current_user)
    db.delete(run)
    db.commit()
    return Response(status_code=204)


@app.get("/api/v1/runs/{run_id}/results", response_model=list[s.ResultOut])
def get_results(run_id: int, current_user: m.User = Depends(get_current_user), db: Session = Depends(get_db)):
    _run(db, run_id, current_user)
    return db.scalars(
        select(m.TestResult).where(m.TestResult.run_id == run_id).order_by(m.TestResult.id)
    ).all()


@app.get("/api/v1/regressions")
def all_regressions(
    project_id: int | None = None,
    current_user: m.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    stmt = (
        select(m.TestResult, m.EvaluationRun, m.Project.name)
        .join(m.EvaluationRun, m.TestResult.run_id == m.EvaluationRun.id)
        .join(m.Project, m.EvaluationRun.project_id == m.Project.id)
        .where(m.Project.user_id == current_user.id, m.TestResult.regression == "regression")
        .order_by(desc(m.EvaluationRun.created_at))
    )
    if project_id is not None:
        _project(db, project_id, current_user)
        stmt = stmt.where(m.EvaluationRun.project_id == project_id)
    rows = db.execute(stmt).all()
    return [
        {
            "run_id": run.id,
            "result_id": result.id,
            "project_id": run.project_id,
            "project_name": proj_name,
            "test_name": result.test_name,
            "errors": result.errors,
            "baseline_passed": result.baseline_passed,
            "current_passed": result.passed,
            "latency_ms": result.latency_ms,
        }
        for result, run, proj_name in rows
    ]


@app.get("/api/v1/projects/{project_id}/regressions")
def regressions(project_id: int, current_user: m.User = Depends(get_current_user), db: Session = Depends(get_db)):
    _project(db, project_id, current_user)
    rows = db.execute(
        select(m.TestResult, m.EvaluationRun)
        .join(m.EvaluationRun)
        .where(m.EvaluationRun.project_id == project_id, m.TestResult.regression == "regression")
        .order_by(desc(m.EvaluationRun.created_at))
    ).all()
    return [
        {
            "run_id": run.id,
            "result_id": result.id,
            "test_name": result.test_name,
            "errors": result.errors,
            "baseline_passed": result.baseline_passed,
            "current_passed": result.passed,
            "latency_ms": result.latency_ms,
        }
        for result, run in rows
    ]


@app.get("/api/v1/projects/{project_id}/baselines")
def baselines(project_id: int, current_user: m.User = Depends(get_current_user), db: Session = Depends(get_db)):
    _project(db, project_id, current_user)
    return db.scalars(
        select(m.EvaluationRun)
        .where(m.EvaluationRun.project_id == project_id, m.EvaluationRun.status == "completed")
        .order_by(desc(m.EvaluationRun.created_at))
    ).all()


@app.delete("/api/v1/projects/{project_id}/data", status_code=200)
def delete_project_data(
    project_id: int,
    current_user: m.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a project's cases, runs/results and related audit events; retain project shell."""
    project = _project(db, project_id, current_user)
    for run in list(project.runs):
        db.delete(run)
    for case in list(project.test_cases):
        db.delete(case)
    db.query(m.AuditEvent).filter(m.AuditEvent.project_id == project_id).delete(synchronize_session=False)
    db.commit()
    return {
        "deleted": True,
        "project_id": project_id,
        "scope": "test cases, runs, results, and project audit events; project configuration retained",
    }
