import pytest
from app.models.idea import Idea
from app.models.validation import ValidationResult
from app.models.recommendation import Recommendation


def test_tenant_authorization_isolation(client, user_headers, db_session):
    """
    Tenant authorization check:
    User B requesting User A's idea/report/compare must receive HTTP 404.
    """
    # Create User B
    client.post(
        "/api/v1/auth/register",
        json={"name": "User B", "email": "userb@example.com", "password": "Password123!"}
    )
    res_b = client.post(
        "/api/v1/auth/login",
        data={"username": "userb@example.com", "password": "Password123!"}
    )
    token_b = res_b.json()["data"]["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # User A creates an idea
    res_idea = client.post(
        "/api/v1/ideas",
        headers=user_headers,
        json={
            "title": "User A Proprietary Venture",
            "description": "Secret tech venture for university students.",
            "target_customer": "College students"
        }
    )
    assert res_idea.status_code == 201
    idea_id = res_idea.json()["data"]["id"]

    # User B attempts to access User A's idea -> 404
    res_get = client.get(f"/api/v1/ideas/{idea_id}", headers=headers_b)
    assert res_get.status_code == 404

    # User B attempts to access User A's reports -> 404
    res_reports = client.get(f"/api/v1/ideas/{idea_id}/reports", headers=headers_b)
    assert res_reports.status_code == 404

    # User B attempts to access User A's comparison -> 404
    res_comp = client.get(f"/api/v1/ideas/{idea_id}/compare", headers=headers_b)
    assert res_comp.status_code == 404

    # User B attempts to validate User A's idea -> 404
    res_val = client.post(f"/api/v1/ideas/{idea_id}/validate", headers=headers_b)
    assert res_val.status_code == 404


def test_versioning_and_unique_constraint(client, user_headers, db_session):
    """
    v1 -> v2 creates a new validation row; delta math is correct.
    UNIQUE(idea_id, version) constraint is enforced.
    """
    res_idea = client.post(
        "/api/v1/ideas",
        headers=user_headers,
        json={
            "title": "Multi-Version Venture",
            "description": "Initial draft of venture concept without pricing.",
            "target_customer": "Freshmen"
        }
    )
    idea_id = res_idea.json()["data"]["id"]

    # Seed v1
    v1 = ValidationResult(
        idea_id=idea_id,
        version=1,
        model_name="mock",
        model_version="1.0",
        prompt_version="v1.3",
        input_hash="hash1",
        overall_score=52.0,
        percentage=52.0,
        confidence_score=60.0,
        classification="Needs Improvement",
        market_demand=5.0,
        problem_severity=5.5,
        competition=4.5,
        target_customer=4.0,
        innovation=6.0,
        feasibility=5.0,
        revenue_potential=4.5
    )
    db_session.add(v1)
    db_session.commit()
    db_session.refresh(v1)

    # Seed a v1 recommendation
    rec1 = Recommendation(
        validation_id=v1.id,
        rec_id="rec_001",
        action="Conduct 15 customer discovery interviews",
        priority="HIGH",
        status="OPEN"
    )
    db_session.add(rec1)
    db_session.commit()

    # Seed v2
    v2 = ValidationResult(
        idea_id=idea_id,
        version=2,
        previous_report_id=v1.id,
        model_name="mock",
        model_version="1.0",
        prompt_version="v1.3",
        input_hash="hash2",
        overall_score=78.5,
        percentage=78.5,
        confidence_score=85.0,
        classification="Promising",
        market_demand=8.0,
        problem_severity=8.0,
        competition=7.5,
        target_customer=8.0,
        innovation=7.0,
        feasibility=8.0,
        revenue_potential=8.5
    )
    db_session.add(v2)
    db_session.commit()
    db_session.refresh(v2)

    # Mark v1 recommendation as completed via endpoint
    res_toggle = client.post(
        f"/api/v1/ideas/{idea_id}/recommendations/rec_001/complete",
        headers=user_headers
    )
    assert res_toggle.status_code == 200
    assert res_toggle.json()["data"]["new_status"] == "COMPLETED"

    # Compare endpoint GET /ideas/{id}/compare?from=1&to=2
    res_comp = client.get(
        f"/api/v1/ideas/{idea_id}/compare?from=1&to=2",
        headers=user_headers
    )
    assert res_comp.status_code == 200
    data = res_comp.json()["data"]

    assert data["overall_delta"] == round(78.5 - 52.0, 1)
    assert data["confidence_delta"] == round(85.0 - 60.0, 1)
    assert "rec_001" in data["completed_recommendations"]

    # Verify per-parameter deltas
    param_map = {p["parameter"]: p for p in data["parameter_deltas"]}
    assert param_map["market_demand"]["delta"] == round(8.0 - 5.0, 1)
    assert "improved" in param_map["market_demand"]["reason_for_change"].lower()

    # Enforce UNIQUE(idea_id, version)
    duplicate_v2 = ValidationResult(
        idea_id=idea_id,
        version=2,
        model_name="mock",
        model_version="1.0",
        input_hash="dup",
        overall_score=70.0,
        confidence_score=70.0,
        classification="Promising"
    )
    db_session.add(duplicate_v2)
    with pytest.raises(Exception):
        db_session.commit()
    db_session.rollback()


def test_user_profile_and_password_endpoints(client, user_headers):
    """GET/PUT /users/profile and PUT /users/password endpoints function as specified."""
    # GET /users/profile
    res_prof = client.get("/api/v1/users/profile", headers=user_headers)
    assert res_prof.status_code == 200
    assert res_prof.json()["data"]["user"]["email"] == "testuser@example.com"

    # PUT /users/profile
    res_update = client.put(
        "/api/v1/users/profile",
        headers=user_headers,
        json={
            "name": "Updated Student Name",
            "college": "MIT University",
            "course": "Computer Science",
            "graduationYear": 2027
        }
    )
    assert res_update.status_code == 200
    updated = res_update.json()["data"]["profile"]
    assert updated["name"] == "Updated Student Name"
    assert updated["college"] == "MIT University"
    assert updated["graduationYear"] == 2027

    # PUT /users/password
    res_pw = client.put(
        "/api/v1/users/password",
        headers=user_headers,
        json={
            "currentPassword": "Password123!",
            "newPassword": "NewStrongPassword456!"
        }
    )
    assert res_pw.status_code == 200

    # Verify login with new password
    res_login = client.post(
        "/api/v1/auth/login",
        data={"username": "testuser@example.com", "password": "NewStrongPassword456!"}
    )
    assert res_login.status_code == 200
