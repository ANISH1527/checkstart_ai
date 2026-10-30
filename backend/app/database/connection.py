from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Normalize PostgreSQL connection strings for full compatibility across Render, Supabase, Neon
db_url = settings.DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

# Check available DBAPI drivers
has_psycopg3 = False
try:
    import psycopg  # noqa
    has_psycopg3 = True
except ImportError:
    has_psycopg3 = False

has_psycopg2 = False
try:
    import psycopg2  # noqa
    has_psycopg2 = True
except ImportError:
    has_psycopg2 = False

# Normalize driver dialect prefix to match whichever driver is installed
if db_url.startswith("postgresql+psycopg://") and not has_psycopg3 and has_psycopg2:
    db_url = db_url.replace("postgresql+psycopg://", "postgresql+psycopg2://", 1)
elif db_url.startswith("postgresql://") and not has_psycopg3 and has_psycopg2:
    db_url = db_url.replace("postgresql://", "postgresql+psycopg2://", 1)
elif db_url.startswith("postgresql+psycopg2://") and not has_psycopg2 and has_psycopg3:
    db_url = db_url.replace("postgresql+psycopg2://", "postgresql+psycopg://", 1)

# Adjust sqlite connect_args if needed
connect_args = {}
if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    db_url,
    connect_args=connect_args,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
