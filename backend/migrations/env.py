from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context
from evalops.db import Base, get_database_url
from evalops import models
from evalops.config import settings

db_url = get_database_url()
config = context.config
config.set_main_option("sqlalchemy.url", db_url)
if config.config_file_name: fileConfig(config.config_file_name)
target_metadata = Base.metadata

def run_migrations_offline():
    context.configure(url=db_url, target_metadata=target_metadata, literal_binds=True, dialect_opts={"paramstyle":"named"})
    with context.begin_transaction(): context.run_migrations()
def run_migrations_online():
    connectable = engine_from_config({"sqlalchemy.url": db_url}, prefix="sqlalchemy.", poolclass=pool.NullPool)
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction(): context.run_migrations()
if context.is_offline_mode(): run_migrations_offline()
else: run_migrations_online()
