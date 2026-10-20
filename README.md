# EvalOps

**Continuous LLM evaluation and regression gates, with deterministic checks that work without an LLM API key.** This repository includes a hardened FastAPI backend, a Next.js engineering UI, a reusable Python evaluation engine/CLI, PostgreSQL support, Docker Compose, automated tests, and a GitHub Actions workflow.

> **Architecture & Scope:** EvalOps provides deterministic evaluation suites, server-side authentication, workspace authorization isolation, encrypted credential management for opt-in external endpoints, baseline regression comparisons, and configurable quality release gates.

## Features Implemented

- **Authentication & Sessions:** User registration, password hashing via bcrypt, secure session token handling with SHA-256 token hashing, HttpOnly cookie support, Bearer authorization, sliding-window rate limiting, and session revocation on logout.
- **Workspace Authorization & Isolation:** Server-side ownership enforcement across Projects, Test Cases, Evaluation Runs, Test Results, and Integrations. Prevents Insecure Direct Object Reference (IDOR) attacks with 401/403 responses.
- **Deterministic Evaluators:** Exact match, case-insensitive contains/not-contains, required JSON fields, JSON Schema validation, token budget estimates, and latency threshold checks.
- **Unambiguous Evaluation Statuses:** Separate and clear statuses for test case results (`passed`, `failed`, `inconclusive`) and baseline regression classifications (`regression`, `improvement`, `unchanged`, `no_baseline`). Missing candidate outputs result in inconclusive evaluations rather than false passes.
- **Baseline Comparison & Regression Reports:** Select any previous completed run as a baseline. Newly failing tests are flagged as regressions with error details, latency deltas, and dedicated regression reports.
- **Protected Secrets & External Integrations:** External model endpoints are opt-in with data disclosure acknowledgements. Provider credentials are encrypted at rest using AES (Fernet), masked in API responses (`sk-••••••••cdef`), and can be tested and revoked securely.
- **Data Retention & Cascading Deletion:** Self-service capabilities to delete individual evaluation runs, clear project test data while retaining suite configuration, delete projects (cascading to runs and cases), or permanently delete the entire user account.
- **Legal & Privacy Policies:** Full Privacy Policy (`/privacy`) and Terms of Service (`/terms`) accurately reflecting system behavior, security safeguards, honest limitations, and data controls.
- **Release Gate:** Minimum pass rate, critical failure rules, max latency, and max estimated-token thresholds; non-zero CLI/CI exit on failed or inconclusive gates.

---

## Run Locally (Backend)

Python 3.11+ is required. From repository root:

```bash
cd backend
python -m venv .venv

# Activate virtual environment
# macOS/Linux: source .venv/bin/activate
# Windows PowerShell: .venv\Scripts\Activate.ps1

python -m pip install -e '.[test]'
```

### Apply Database Migrations

Apply Alembic migrations to create or upgrade database tables:

```bash
alembic upgrade head
```

### Start the API Server

```bash
uvicorn evalops.api:app --reload
```

API docs: <http://localhost:8000/docs> (disabled in production mode).
The default database is SQLite (`evalops.db`) for development. To use PostgreSQL, set `DATABASE_URL` in `.env` (e.g. `postgresql+psycopg://user:password@localhost:5432/evalops`).

---

## Run the Frontend

In another terminal, from `frontend/`:

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. The default API base is `http://localhost:8000/api/v1`.

Pages include:
- **Landing Page:** `/`
- **Sign In & Register:** `/login`, `/register`
- **Projects:** `/projects`, `/projects/[id]`
- **Evaluation Runs:** `/runs`, `/runs/[id]`
- **Test Cases:** `/test-cases`
- **Regression Reports:** `/regressions`
- **Integrations:** `/integrations`
- **Workspace Settings:** `/settings`
- **Privacy Policy:** `/privacy`
- **Terms of Service:** `/terms`
- **Documentation:** `/docs`

---

## Run Tests

### Backend Test Suite

```bash
cd backend
pytest -v
```

Automated tests cover:
- Authentication (registration, duplicate rejection, login, generic error responses, logout, session revocation)
- Authorization & workspace isolation (multi-user isolation, IDOR prevention on projects, cases, runs, and data deletion)
- Deterministic engine checks (exact match pass/fail, JSON schema, missing outputs)
- Baseline regression classifications and status consistency
- Secrets protection (API keys never returned in plaintext, masked keys, encryption at rest)

### Frontend Build & Typecheck

```bash
cd frontend
npm run build
```

---

## Run the CLI

From `backend/`:

```bash
python -m evalops.cli validate-config --project-config ../examples/evalops.yaml
python -m evalops.cli evaluate --project-config ../examples/evalops.yaml --output-json ../evalops-report.json --github-summary
```

---

## Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | SQLAlchemy database URL | `sqlite:///./evalops.db` |
| `SECRET_KEY` | Master key for session tokens and AES credential encryption | Required in production |
| `ENVIRONMENT` | `development` or `production` | `development` |
| `CORS_ORIGINS` | Permitted frontend origins (comma-separated) | `http://localhost:3000` |
| `SESSION_COOKIE_SECURE` | Set `true` in production to enforce HTTPS cookies | `false` |
| `RATE_LIMIT_AUTH_PER_MIN`| Maximum login/register attempts per minute per IP | `15` |
| `PRIVACY_CONTACT` | Designated privacy contact address | Required before production |
| `NEXT_PUBLIC_API_URL` | Frontend API base URL | `http://localhost:8000/api/v1` |

---

## API Overview

All endpoints are versioned under `/api/v1`:

### Authentication & Account
- `POST /auth/register` — Register a new account
- `POST /auth/login` — Sign in and obtain session token
- `POST /auth/logout` — Revoke active session
- `GET /auth/me` — Get authenticated user details
- `PATCH /auth/me` — Update name or password
- `DELETE /auth/me` — Permanently delete user account and all workspace data

### Projects & Test Cases
- `GET|POST /projects` — List or create projects
- `GET|PATCH|DELETE /projects/{project_id}` — Manage project
- `GET|POST /projects/{project_id}/test-cases` — List or create test cases
- `PATCH|DELETE /test-cases/{case_id}` — Update or delete test case
- `DELETE /projects/{project_id}/data` — Clear test data while retaining project shell

### Evaluations & Regressions
- `GET /runs` — List user's evaluation runs
- `POST /projects/{project_id}/runs` — Run evaluation (with optional `baseline_run_id`)
- `GET|DELETE /runs/{run_id}` — View or delete evaluation run
- `GET /runs/{run_id}/results` — View detailed test results
- `GET /projects/{project_id}/baselines` — List completed runs eligible as baselines
- `GET /projects/{project_id}/regressions` — List confirmed regression findings

### Integrations
- `GET|POST /integrations` — List or configure model provider credentials
- `PATCH|DELETE /integrations/{id}` — Update settings or revoke credentials
- `POST /integrations/{id}/test` — Test provider connection securely

---

## Security & Deployment Considerations

- **Production Security:** Always set a random 32+ character `SECRET_KEY`, enable `SESSION_COOKIE_SECURE=true`, serve all traffic over TLS/HTTPS, and configure `PRIVACY_CONTACT`.
- **Database:** SQLite is intended for local development. Use PostgreSQL for production deployments.
- **Synchronous Evaluations:** Evaluations run synchronously. For heavy suites or long-running network targets, evaluations should be moved to an asynchronous worker queue.
