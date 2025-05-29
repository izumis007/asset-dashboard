from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
import os

# Alembic用の同期エンジン
database_url = os.getenv('DATABASE_URL', '').replace('postgresql+asyncpg://', 'postgresql+psycopg2://')

engine = create_engine(database_url, echo=False)

# Base class for models
Base = declarative_base()

# Session factory
SessionLocal = sessionmaker(bind=engine)
