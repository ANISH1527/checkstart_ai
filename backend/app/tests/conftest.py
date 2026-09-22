import os
os.environ["TESTING"] = "1"
os.environ["CELERY_TASK_ALWAYS_EAGER"] = "True"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app as fastapi_app
import app.models  # Register all models on Base.metadata
from app.models.user import User
from app.database.base import Base
from app.database.connection import get_db
from app.core.limiter import limiter

limiter.enabled = False

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()

    import app.services.tasks
    app.services.tasks.SessionLocal = TestingSessionLocal

    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def db(db_session):
    return db_session


@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    fastapi_app.dependency_overrides[get_db] = override_get_db
    with TestClient(fastapi_app) as c:
        yield c
    fastapi_app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def user_token(client):
    client.post(
        "/api/v1/auth/register",
        json={"name": "Test User", "email": "testuser@example.com", "password": "Password123!"}
    )
    res = client.post(
        "/api/v1/auth/login",
        data={"username": "testuser@example.com", "password": "Password123!"}
    )
    return res.json()["data"]["access_token"]


@pytest.fixture(scope="function")
def user_headers(user_token):
    return {"Authorization": f"Bearer {user_token}"}


@pytest.fixture(scope="function")
def admin_token(client, db_session):
    client.post(
        "/api/v1/auth/register",
        json={"name": "Admin User", "email": "testadmin@example.com", "password": "Password123!"}
    )
    user = db_session.query(User).filter(User.email == "testadmin@example.com").first()
    if user:
        user.role = "ADMIN"
        db_session.commit()

    res = client.post(
        "/api/v1/auth/login",
        data={"username": "testadmin@example.com", "password": "Password123!"}
    )
    return res.json()["data"]["access_token"]


@pytest.fixture(scope="function")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture(scope="function")
def seed_idea(client, user_headers):
    res = client.post(
        "/api/v1/ideas",
        headers=user_headers,
        json={
            "title": "Seed Idea Title",
            "description": "Seed idea description for automated testing.",
            "problem": "Seed problem description",
            "target_customer": "Seed target customer",
            "solution": "Seed solution description",
            "industry": "Tech"
        }
    )
    return res.json()["data"]["id"]
