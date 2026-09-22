import pytest

EXPECTED_LAYERS = [
    "profile_extraction", "nlp_processing", "vector_embedding", "similarity_matching", "rule_engine",
    "evidence_layer", "llm_analysis", "verification_check", "scoring_engine", "confidence_engine",
    "information_gaps", "root_cause_analysis", "improvement_strategy",
    "action_prioritization", "impact_prediction"
]


def test_full_validation_lifecycle(client):
    # 1. Register & Login User
    reg_res = client.post(
        "/api/v1/auth/register",
        json={"name": "Lifecycle Founder", "email": "lifecycle@example.com", "password": "Password123!"}
    )
    assert reg_res.status_code == 201
    assert reg_res.json()["data"]["email"] == "lifecycle@example.com"

    login_res = client.post(
        "/api/v1/auth/login",
        data={"username": "lifecycle@example.com", "password": "Password123!"}
    )
    assert login_res.status_code == 200
    token = login_res.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Create Idea
    idea_res = client.post(
        "/api/v1/ideas",
        headers=headers,
        json={
            "title": "AI Lifecycle Optimizer",
            "description": "End-to-end integration test startup idea for automated validation pipeline.",
            "problem": "Manual validation of ideas is error prone.",
            "target_customer": "Early stage founders",
            "solution": "Automated validation agent",
            "industry": "SaaS"
        }
    )
    assert idea_res.status_code == 201
    idea_data = idea_res.json()["data"]
    idea_id = idea_data["id"]
    assert idea_data["title"] == "AI Lifecycle Optimizer"

    # 3. Enqueue Validation Task
    val_enqueue = client.post(f"/api/v1/ideas/{idea_id}/validate", headers=headers)
    assert val_enqueue.status_code == 200
    enqueue_data = val_enqueue.json()["data"]
    assert "job_id" in enqueue_data
    assert enqueue_data["status"] in ["PENDING", "COMPLETED"]

    # 4. Poll Status
    status_res = client.get(f"/api/v1/ideas/{idea_id}/validation/status", headers=headers)
    assert status_res.status_code == 200
    status_data = status_res.json()["data"]
    assert status_data["status"] == "COMPLETED"

    # 5. Fetch Detailed Validation Result
    details_res = client.get(f"/api/v1/ideas/{idea_id}/validation", headers=headers)
    assert details_res.status_code == 200
    details = details_res.json()["data"]
    assert details["idea_id"] == idea_id
    assert details["version"] == 1
    assert "overall_score" in details
    assert "recommendations" in details

    # 6. Fetch Markdown Export Report
    report_res = client.get(f"/api/v1/reports/{idea_id}/markdown", headers=headers)
    assert report_res.status_code == 200
    assert "Validation Report" in report_res.text

    # 7. Soft Delete Idea
    del_res = client.delete(f"/api/v1/ideas/{idea_id}", headers=headers)
    assert del_res.status_code == 204

    # 8. Confirm 404 on Deleted Idea
    get_del = client.get(f"/api/v1/ideas/{idea_id}", headers=headers)
    assert get_del.status_code == 404


def test_revalidation_creates_new_row_not_update(client, user_token, seed_idea):
    idea_id = seed_idea["id"] if isinstance(seed_idea, dict) else seed_idea
    headers = {"Authorization": f"Bearer {user_token}"} if isinstance(user_token, str) else user_token

    # First validation
    client.post(f"/api/v1/ideas/{idea_id}/validate", headers=headers)

    # Update idea text slightly
    client.put(f"/api/v1/ideas/{idea_id}",
               json={"description": "Updated description with new pricing model defined"},
               headers=headers)

    # Second validation (revalidate)
    client.post(f"/api/v1/ideas/{idea_id}/revalidate", headers=headers)

    # History must show 2 separate immutable rows
    r = client.get(f"/api/v1/ideas/{idea_id}/history", headers=headers)
    history = r.json()["data"]
    assert history["total"] == 2
    assert history["items"][0]["version"] != history["items"][1]["version"]
    versions = {item["version"] for item in history["items"]}
    assert versions == {1, 2}


def test_version_comparison_returns_delta(client, user_token, seed_idea):
    idea_id = seed_idea["id"] if isinstance(seed_idea, dict) else seed_idea
    headers = {"Authorization": f"Bearer {user_token}"} if isinstance(user_token, str) else user_token

    client.post(f"/api/v1/ideas/{idea_id}/validate", headers=headers)
    client.post(f"/api/v1/ideas/{idea_id}/revalidate", headers=headers)

    r = client.get(f"/api/v1/ideas/{idea_id}/comparison?v1=1&v2=2", headers=headers)
    assert r.status_code == 200
    data = r.json()["data"]
    assert data["v1"]["version"] == 1
    assert data["v2"]["version"] == 2
    assert "score_delta" in data
    assert isinstance(data["score_delta"], (int, float))


def test_pipeline_timing_has_all_15_layers(client, user_token, seed_idea):
    idea_id = seed_idea["id"] if isinstance(seed_idea, dict) else seed_idea
    headers = {"Authorization": f"Bearer {user_token}"} if isinstance(user_token, str) else user_token

    client.post(f"/api/v1/ideas/{idea_id}/validate", headers=headers)

    r = client.get(f"/api/v1/ideas/{idea_id}/validation", headers=headers)
    timing = r.json()["data"]["pipeline_timing"]
    assert isinstance(timing, dict)
    assert len(timing) == 15, f"Expected 15 layers, got {len(timing)}: {list(timing.keys())}"
    for layer in EXPECTED_LAYERS:
        assert any(layer in k for k in timing.keys()), f"Missing layer in timing: {layer}"
    for k, v in timing.items():
        assert v >= 0, f"Negative timing for layer: {k}"
