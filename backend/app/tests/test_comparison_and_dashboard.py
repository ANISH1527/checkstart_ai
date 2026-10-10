import pytest
from app.models.idea import Idea
from app.models.validation import ValidationResult
from app.repositories.validation_repository import ValidationRepository


def _seed_quick_validation(db_session, idea_id: int, score: float = 82.0) -> ValidationResult:
    val_repo = ValidationRepository(db_session)
    val = val_repo.create_validation_result(
        idea_id=idea_id,
        version=1,
        model_name="mock-llm",
        model_version="v1",
        prompt_version="v1.2",
        input_hash="quick_test_hash",
        overall_score=score,
        confidence_score=85.0,
        classification="STRONG",
        pipeline_timing={},
        summary="A validated startup venture with strong market alignment.",
        strategic_verdict="Viable opportunity.",
        recommended_action="Execute customer discovery interviews.",
        analysis_json={
            "strengths": ["Differentiated solution", "Clear customer pain"],
            "weaknesses": ["Distribution needs testing"],
            "market_analysis": "Target market is growing at 15% CAGR."
        }
    )
    val_repo.save_scores(val.id, [
        {"parameter": "market_demand", "score": score, "confidence": 80.0, "reason": "Good demand"},
        {"parameter": "problem_solution_fit", "score": score, "confidence": 80.0, "reason": "Good fit"},
        {"parameter": "competition", "score": score - 10.0, "confidence": 75.0, "reason": "Moderate competition"},
        {"parameter": "target_customer_clarity", "score": score, "confidence": 85.0, "reason": "Clear persona"},
        {"parameter": "uniqueness", "score": score, "confidence": 75.0, "reason": "Unique feature set"},
        {"parameter": "technical_feasibility", "score": 90.0, "confidence": 90.0, "reason": "Feasible"},
        {"parameter": "business_potential", "score": score, "confidence": 80.0, "reason": "Sound model"},
        {"parameter": "scalability", "score": score, "confidence": 75.0, "reason": "Scalable"},
        {"parameter": "risk", "score": 30.0, "confidence": 70.0, "reason": "Manageable risk"}
    ])
    return val


def test_dashboard_stats_endpoint(client, user_headers, db_session, test_user):
    # Create and validate an idea
    idea = Idea(
        user_id=test_user.id,
        title="Smart AgriTech",
        description="IoT sensors for precision soil nutrition monitoring.",
        problem="Fertilizer waste and crop loss.",
        target_customer="Commercial farmers",
        solution="IoT sensor array",
        industry="AgriTech"
    )
    db_session.add(idea)
    db_session.commit()
    db_session.refresh(idea)

    _seed_quick_validation(db_session, idea.id, score=85.0)

    res = client.get("/api/v1/ideas/dashboard/stats", headers=user_headers)
    assert res.status_code == 200
    data = res.json()["data"]
    stats = data.get("stats", data)
    assert stats["totalIdeas"] >= 1
    assert stats["totalValidations"] >= 1
    assert "categories" in stats
    assert "recentAnalyses" in stats


def test_comparison_requires_at_least_two_ideas(client, user_headers):
    res = client.post(
        "/api/v1/ideas/compare",
        headers=user_headers,
        json={"ideaIds": ["1"]}
    )
    assert res.status_code == 400
    assert "between 2 and 4 distinct ideas" in res.json()["message"]


def test_comparison_requires_validated_ideas(client, user_headers, db_session, test_user):
    # Create two ideas without validating
    i1 = Idea(user_id=test_user.id, title="Unvalidated Idea 1", description="Description 1")
    i2 = Idea(user_id=test_user.id, title="Unvalidated Idea 2", description="Description 2")
    db_session.add_all([i1, i2])
    db_session.commit()

    res = client.post(
        "/api/v1/ideas/compare",
        headers=user_headers,
        json={"ideaIds": [str(i1.id), str(i2.id)]}
    )
    assert res.status_code == 400
    assert "has not been validated yet" in res.json()["message"]


def test_comparison_success_with_two_validated_ideas(client, user_headers, db_session, test_user):
    i1 = Idea(user_id=test_user.id, title="Venture One", description="Description 1", industry="FinTech")
    i2 = Idea(user_id=test_user.id, title="Venture Two", description="Description 2", industry="HealthTech")
    db_session.add_all([i1, i2])
    db_session.commit()

    _seed_quick_validation(db_session, i1.id, score=88.0)
    _seed_quick_validation(db_session, i2.id, score=74.0)

    res = client.post(
        "/api/v1/ideas/compare",
        headers=user_headers,
        json={"ideaIds": [str(i1.id), str(i2.id)]}
    )
    assert res.status_code == 200
    data = res.json()["data"]
    assert len(data["ideas"]) == 2
    assert len(data["rankedOrder"]) == 2
    assert "Disclaimer: This comparison is decision support analysis" in data["comparisonSummary"]


def test_user_profile_and_settings(client, user_headers):
    # Update profile
    prof_res = client.put(
        "/api/v1/user/profile",
        headers=user_headers,
        json={"college": "Stanford University", "course": "CS", "graduationYear": 2026}
    )
    assert prof_res.status_code == 200
    user_data = prof_res.json()["data"]["user"]
    assert user_data["college"] == "Stanford University"
    assert user_data["graduationYear"] == 2026

    # Update settings
    sett_res = client.put(
        "/api/v1/user/settings",
        headers=user_headers,
        json={"theme": "dark", "emailNotifications": False}
    )
    assert sett_res.status_code == 200
    settings_data = sett_res.json()["data"]["settings"]
    assert settings_data["theme"] == "dark"
    assert settings_data["emailNotifications"] is False
