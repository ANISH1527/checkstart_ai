def test_register_user(client):
    response = client.post(
        "/api/v1/auth/register",
        json={"name": "Test Founder", "email": "founder@example.com", "password": "securepassword123"}
    )
    assert response.status_code == 201
    data = response.json()["data"]
    assert data["email"] == "founder@example.com"
    assert "id" in data
    assert "token" in data
    assert data["user"]["role"] == "USER"


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


def test_tc02_student_login(client):
    """TC-02: Student founder login with email and password returns valid JWT."""
    client.post(
        "/api/v1/auth/register",
        json={"name": "Collegiate Founder", "email": "student.founder@campus.edu", "password": "StudentPass123!"}
    )
    res = client.post(
        "/api/v1/auth/login",
        data={"username": "student.founder@campus.edu", "password": "StudentPass123!"}
    )
    assert res.status_code == 200
    data = res.json()["data"]
    assert "access_token" in data
    assert data["user"]["email"] == "student.founder@campus.edu"
    assert data["token_type"] == "bearer"


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


def test_google_auth_successful_login(client):
    """Test successful Google login using a valid token and user creation."""
    res = client.post(
        "/api/v1/auth/google",
        json={"credential": "mock_valid_google_token_founder@google.com"}
    )
    assert res.status_code == 200
    data = res.json()["data"]
    assert "token" in data
    assert data["user"]["email"] == "founder@google.com"
    assert data["user"]["authProvider"] == "GOOGLE"
    assert data["user"]["role"] == "USER"


def test_google_auth_invalid_token_rejection(client):
    """Test that an invalid or malformed Google ID token is strictly rejected with 401."""
    res = client.post(
        "/api/v1/auth/google",
        json={"credential": "invalid.untrusted.fake_google_jwt_token"}
    )
    assert res.status_code == 401
    assert "verification failed" in res.json()["message"].lower()


def test_google_auth_missing_credential_rejected(client):
    """Test that requests lacking a credential field are rejected (422 validation error)."""
    res = client.post(
        "/api/v1/auth/google",
        json={"email": "attacker@example.com", "name": "Attacker"}
    )
    assert res.status_code == 422


def test_google_auth_empty_credential_rejected(client):
    """Test that empty string credentials are rejected with validation error."""
    res = client.post(
        "/api/v1/auth/google",
        json={"credential": "   "}
    )
    assert res.status_code == 422 or res.status_code == 400


def test_google_user_cannot_login_with_blank_password(client):
    """A Google-registered user without local password receives helpful error on password form."""
    client.post(
        "/api/v1/auth/google",
        json={"credential": "mock_valid_google_token_oauth_only@google.com"}
    )
    # Attempt email/password login
    res = client.post(
        "/api/v1/auth/login",
        json={"identifier": "oauth_only@google.com", "password": "AnyPassword!"}
    )
    assert res.status_code == 401
    assert "Google Sign-In" in res.json()["message"]


def test_api_endpoint_compatibility_both_prefixes(client):
    """Verify that auth endpoints are accessible on both /api/v1 and /api prefixes."""
    # Test on /api prefix (frontend default)
    res_api = client.post(
        "/api/auth/register",
        json={"name": "Dual Prefix", "email": "dual@example.com", "password": "DualPassword123!"}
    )
    assert res_api.status_code == 201

    res_v1 = client.post(
        "/api/v1/auth/login",
        json={"identifier": "dual@example.com", "password": "DualPassword123!"}
    )
    assert res_v1.status_code == 200


def test_cors_preflight_vercel_origin(client):
    """Verify CORS preflight OPTIONS request permits Vercel frontend deployments."""
    res = client.options(
        "/api/auth/login",
        headers={
            "Origin": "https://checkstart-ai.vercel.app",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "Content-Type,Authorization"
        }
    )
    assert res.status_code == 200
    assert res.headers.get("access-control-allow-origin") == "https://checkstart-ai.vercel.app"
