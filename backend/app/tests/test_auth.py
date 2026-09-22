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
