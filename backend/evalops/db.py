import os
import logging
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from .config import settings

logger = logging.getLogger("evalops.db")

def get_database_url() -> str:
    """Normalize database URL for SQLAlchemy 2.0 with psycopg v3."""
    url = settings.database_url
    if url.startswith("postgres://"):
        return "postgresql+psycopg://" + url[len("postgres://"):]
    if url.startswith("postgresql://") and not url.startswith("postgresql+"):
        return "postgresql+psycopg://" + url[len("postgresql://"):]
    return url

db_url = get_database_url()
is_serverless = bool(os.getenv("VERCEL")) or settings.environment == "production"

if is_serverless and db_url.startswith("sqlite"):
    logger.warning(
        "WARNING: Running SQLite in a serverless production environment. "
        "Serverless functions have ephemeral filesystems and data will not persist across function invocations. "
        "Configure DATABASE_URL to a hosted PostgreSQL instance (e.g., Neon, Supabase, Vercel Postgres)."
    )

connect_args = {"check_same_thread": False} if db_url.startswith("sqlite") else {}
if db_url.startswith("sqlite"):
    pool_kwargs = {}
elif is_serverless:
    # Serverless runtime: conservative pool to avoid exhausting hosted DB connection limits
    pool_kwargs = {"pool_size": 2, "max_overflow": 3, "pool_recycle": 300}
else:
    pool_kwargs = {"pool_size": 10, "max_overflow": 20}

engine = create_engine(db_url, connect_args=connect_args, pool_pre_ping=True, **pool_kwargs)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)

class Base(DeclarativeBase):
    pass

def ensure_schema_upgrades(db_engine):
    """Ensure newly introduced columns exist in tables created before the migration."""
    try:
        with db_engine.connect() as conn:
            inspector = inspect(conn)
            tables = inspector.get_table_names()
            if "projects" in tables:
                cols = [c["name"] for c in inspector.get_columns("projects")]
                if "user_id" not in cols:
                    conn.execute(text("ALTER TABLE projects ADD COLUMN user_id INTEGER"))
                    conn.commit()
            if "audit_events" in tables:
                cols = [c["name"] for c in inspector.get_columns("audit_events")]
                if "user_id" not in cols:
                    conn.execute(text("ALTER TABLE audit_events ADD COLUMN user_id INTEGER"))
                    conn.commit()
            if "test_results" in tables:
                cols = [c["name"] for c in inspector.get_columns("test_results")]
                if "status" not in cols:
                    conn.execute(text("ALTER TABLE test_results ADD COLUMN status VARCHAR(24) DEFAULT 'completed'"))
                    conn.commit()
                indexes = [ix["name"] for ix in inspector.get_indexes("test_results")]
                if "ix_test_results_regression" not in indexes:
                    try:
                        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_test_results_regression ON test_results (regression)"))
                        conn.commit()
                    except Exception:
                        pass
    except Exception as exc:
        pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
