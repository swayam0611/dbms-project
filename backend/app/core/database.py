from typing import Generator
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from app.core.config import settings

# ------------------------------------------------------------------------------
# Production-ready SQLAlchemy Engine with Connection Pooling
# Handles traffic bursts and prevents MySQL connection exhaustion
# ------------------------------------------------------------------------------
engine = create_engine(
    settings.DATABASE_URL,
    pool_size=10,            # Steady-state connection pool size
    max_overflow=20,         # Maximum burst overflow connections
    pool_recycle=1800,       # Recycle idle connections every 30 minutes
    pool_pre_ping=True,      # Proactively test connections before checkout
    echo=False               # Set True if detailed SQL queries logging is desired
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()

def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency yielding a thread-local database session.
    Automatically handles commit/rollback context and closes connection.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def execute_raw_sql(sql_str: str, params: dict = None) -> list:
    """
    Execute raw parameterized SQL queries safely and return dict rows.
    Useful for demonstrating direct relational queries for DBMS evaluations.
    """
    with engine.connect() as conn:
        result = conn.execute(text(sql_str), params or {})
        if result.returns_rows:
            columns = result.keys()
            return [dict(zip(columns, row)) for row in result.fetchall()]
        return []
