import os
import pytest
from sqlalchemy.orm import Session
from evalops.db import Base, engine, ensure_schema_upgrades
from evalops import models as m


@pytest.fixture(autouse=True)
def clean_test_db():
    Base.metadata.create_all(bind=engine)
    ensure_schema_upgrades(engine)
    with Session(engine) as session:
        session.query(m.AuditEvent).delete()
        session.query(m.TestResult).delete()
        session.query(m.EvaluationRun).delete()
        session.query(m.TestCase).delete()
        session.query(m.Project).delete()
        session.query(m.UserIntegration).delete()
        session.query(m.UserSession).delete()
        session.query(m.User).delete()
        session.commit()
    yield
