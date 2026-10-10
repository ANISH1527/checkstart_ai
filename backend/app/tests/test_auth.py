def test_register_user(client):
    response = client.post(
        "/api/v1/auth/register",
        json={"name": "Test Founder", "email": "founder@example.com", "password": "securepassword123"}
    )
    assert response.status_code == 201
    data = response.json()["data"]
    assert data["email"] == "founder@example.com"
    assert "id" in data


def test_register_duplicate_email(client):
    user_data = {"name": "Test Founder", "email": "dup@example.com", "password": "securepassword123"}
    client.post("/api/v1/auth/register", json=user_data)
    response = client.post("/api/v1/auth/register", json=user_data)
    assert response.status_code == 400
    assert "already registered" in response.json()["message"]


def test_login_and_me(client):
    client.post(
        "/api/v1/auth/register",
        json={"name": "Login User", "email": "login@example.com", "password": "mypassword"}
    )
    login_res = client.post(
        "/api/v1/auth/login",
        data={"username": "login@example.com", "password": "mypassword"}
    )
    assert login_res.status_code == 200
    token = login_res.json()["data"]["access_token"]

    me_res = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert me_res.status_code == 200
    assert me_res.json()["data"]["email"] == "login@example.com"


def test_login_invalid_password_returns_specific_error(client):
    client.post(
        "/api/v1/auth/register",
        json={"name": "Alice Smith", "email": "alice@example.com", "password": "CorrectPassword123!"}
    )
    res = client.post(
        "/api/v1/auth/login",
        json={"identifier": "alice@example.com", "password": "WrongPassword!"}
    )
    assert res.status_code == 401
    body = res.json()
    assert body["message"] == "Incorrect email or password."
    assert body["message"] != "Invalid or expired token"


def test_login_nonexistent_user(client):
    res = client.post(
        "/api/v1/auth/login",
        json={"identifier": "nonexistent@example.com", "password": "AnyPassword123!"}
    )
    assert res.status_code == 401
    body = res.json()
    assert body["message"] == "Incorrect email or password."


def test_login_with_username_or_name(client):
    client.post(
        "/api/v1/auth/register",
        json={"name": "Bob Founder", "email": "bob@example.com", "password": "ValidPassword123!"}
    )
    # Log in using the display name / username instead of email
    res = client.post(
        "/api/v1/auth/login",
        json={"identifier": "Bob Founder", "password": "ValidPassword123!"}
    )
    assert res.status_code == 200
    data = res.json()["data"]
    assert "token" in data
    assert data["user"]["email"] == "bob@example.com"


def test_login_empty_credentials(client):
    res = client.post(
        "/api/v1/auth/login",
        json={"identifier": "", "password": ""}
    )
    assert res.status_code == 400
    assert "Username/email and password are required." in res.json()["message"]


def test_google_auth_new_user_creation(client):
    res = client.post(
        "/api/v1/auth/google",
        json={
            "name": "Google Newbie",
            "email": "newbie@google.com",
            "googleId": "google_sub_12345",
            "profileImage": "https://lh3.googleusercontent.com/sample"
        }
    )
    assert res.status_code == 200
    data = res.json()["data"]
    assert "token" in data
    assert data["user"]["email"] == "newbie@google.com"
    assert data["user"]["authProvider"] == "GOOGLE"


