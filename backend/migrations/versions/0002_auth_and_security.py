"""Add users, sessions, integrations, and workspace authorization columns.

Revision ID: 0002_auth_and_security
Revises: 0001_initial
Create Date: 2026-10-19
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect
from evalops.db import Base
from evalops import models

revision = '0002_auth_and_security'
down_revision = '0001_initial'
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    inspector = inspect(bind)
    existing_tables = inspector.get_table_names()

    # Create missing tables from metadata if they don't exist
    Base.metadata.create_all(bind=bind)

    # If tables already existed, check and add missing columns
    if 'projects' in existing_tables:
        cols = [c['name'] for c in inspector.get_columns('projects')]
        if 'user_id' not in cols:
            op.add_column('projects', sa.Column('user_id', sa.Integer(), nullable=True))
            try:
                op.create_index('ix_projects_user_id', 'projects', ['user_id'])
            except Exception:
                pass

    if 'audit_events' in existing_tables:
        cols = [c['name'] for c in inspector.get_columns('audit_events')]
        if 'user_id' not in cols:
            op.add_column('audit_events', sa.Column('user_id', sa.Integer(), nullable=True))

    if 'test_results' in existing_tables:
        cols = [c['name'] for c in inspector.get_columns('test_results')]
        if 'status' not in cols:
            op.add_column('test_results', sa.Column('status', sa.String(24), server_default='completed', nullable=False))


def downgrade():
    pass
