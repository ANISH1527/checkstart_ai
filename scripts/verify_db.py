"""
Database Connectivity & Schema Verification Script for CheckStart AI.

Security:
- Masks all credentials and passwords in connection strings.
- Strictly read-only operations (SELECT 1, schema inspection).
- Never modifies or deletes any database records.

Verification Steps:
1. Normalizes and validates connection string format.
2. Establishes connection via SQLAlchemy 2.0 engine.
3. Executes a safe SELECT 1 ping.
4. Queries PostgreSQL server version.
5. Inspects existing tables in the public schema.
6. Queries the alembic_version revision table.
"""

import argparse
import os
import sys
import time
import urllib.parse
from sqlalchemy import create_engine, text, inspect


def mask_db_url(url: str) -> str:
    """Mask database passwords for safe console logging."""
    try:
        parsed = urllib.parse.urlsplit(url)
        netloc = parsed.netloc
        if "@" in netloc:
            auth, host_port = netloc.split("@", 1)
            if ":" in auth:
                user, _ = auth.split(":", 1)
                netloc = f"{user}:****@{host_port}"
            else:
                netloc = f"****@{host_port}"
        return urllib.parse.urlunsplit((parsed.scheme, netloc, parsed.path, parsed.query, parsed.fragment))
    except Exception:
        return "[MASKED_DATABASE_URL]"


def normalize_db_url(url: str) -> str:
    """Normalize URL and select available driver (psycopg or psycopg2)."""
    db_url = url.strip()
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)

    has_psycopg3 = False
    try:
        import psycopg  # noqa
        has_psycopg3 = True
    except ImportError:
        pass

    has_psycopg2 = False
    try:
        import psycopg2  # noqa
        has_psycopg2 = True
    except ImportError:
        pass

    if db_url.startswith("postgresql+psycopg://") and not has_psycopg3 and has_psycopg2:
        db_url = db_url.replace("postgresql+psycopg://", "postgresql+psycopg2://", 1)
    elif db_url.startswith("postgresql://") and not has_psycopg3 and has_psycopg2:
        db_url = db_url.replace("postgresql://", "postgresql+psycopg2://", 1)
    elif db_url.startswith("postgresql+psycopg2://") and not has_psycopg2 and has_psycopg3:
        db_url = db_url.replace("postgresql+psycopg2://", "postgresql+psycopg://", 1)

    return db_url


def verify_database(raw_url: str) -> bool:
    masked = mask_db_url(raw_url)
    print(f"\n[CONFIG] Target Database URL: {masked}")

    resolved_url = normalize_db_url(raw_url)
    resolved_masked = mask_db_url(resolved_url)
    print(f"[CONFIG] Resolved Dialect URL: {resolved_masked}")

    connect_args = {}
    if resolved_url.startswith("sqlite"):
        connect_args = {"check_same_thread": False}

    print("\n[STEP 1] Initializing SQLAlchemy 2.0 Engine...")
    try:
        engine = create_engine(
            resolved_url,
            connect_args=connect_args,
            pool_pre_ping=True
        )
        print(f"[STEP 1] SUCCESS: Engine initialized (Dialect: {engine.dialect.name}, Driver: {engine.driver})")
    except Exception as e:
        print(f"[STEP 1] FAILURE: Could not initialize engine - {type(e).__name__}: {e}")
        return False

    print("\n[STEP 2] Testing Connection & Executing SELECT 1...")
    start_time = time.time()
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1")).scalar()
            elapsed_ms = round((time.time() - start_time) * 1000, 2)
            if result == 1:
                print(f"[STEP 2] SUCCESS: SELECT 1 executed successfully in {elapsed_ms}ms (Result: {result})")
            else:
                print(f"[STEP 2] WARNING: Expected 1, received {result}")
                return False

            # Query server version if PostgreSQL
            if engine.dialect.name == "postgresql":
                try:
                    version = conn.execute(text("SELECT version()")).scalar()
                    print(f"[STEP 2] Database Version: {version}")
                except Exception as e:
                    print(f"[STEP 2] Notice: Could not read version: {e}")
    except Exception as e:
        print(f"[STEP 2] FAILURE: Connection failed - {type(e).__name__}: {e}")
        return False

    print("\n[STEP 3] Inspecting Database Tables & Schema...")
    try:
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        print(f"[STEP 3] Total Tables Found: {len(tables)}")
        if tables:
            print(f"[STEP 3] Table List: {', '.join(sorted(tables))}")
        else:
            print("[STEP 3] NOTICE: No tables currently exist in public schema (run migrations or app boot).")
    except Exception as e:
        print(f"[STEP 3] WARNING: Could not inspect tables - {e}")
        return False

    print("\n[STEP 4] Checking Alembic Migration Revision...")
    try:
        with engine.connect() as conn:
            if "alembic_version" in tables:
                rev = conn.execute(text("SELECT version_num FROM alembic_version")).scalar()
                print(f"[STEP 4] SUCCESS: Current Alembic Migration Revision: {rev}")
            else:
                print("[STEP 4] NOTICE: Table 'alembic_version' not present yet.")
    except Exception as e:
        print(f"[STEP 4] NOTICE: Could not query alembic_version - {e}")

    print("\n=============================================")
    print("DATABASE CONNECTIVITY VERIFICATION: PASSED (OK)")
    print("=============================================\n")
    return True


def main():
    parser = argparse.ArgumentParser(description="Verify database connectivity safely.")
    parser.add_argument("--url", default=None, help="Database connection URL (defaults to DATABASE_URL env var or settings).")
    args = parser.parse_args()

    url = args.url or os.getenv("DATABASE_URL")
    if not url:
        # Fallback to backend app settings default if available
        try:
            sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "backend"))
            from app.core.config import settings
            url = settings.DATABASE_URL
            print(f"[NOTICE] Using DATABASE_URL configured in backend settings.")
        except Exception:
            pass

    if not url:
        print("ERROR: Provide a database URL via --url or set the DATABASE_URL environment variable.")
        sys.exit(1)

    success = verify_database(url)
    sys.exit(0) if success else sys.exit(1)


if __name__ == "__main__":
    main()
