from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from .config import settings

connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
pool_kwargs = {} if settings.database_url.startswith("sqlite") else {"pool_size": 10, "max_overflow": 20}
engine = create_engine(settings.database_url, connect_args=connect_args, pool_pre_ping=True, **pool_kwargs)
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
