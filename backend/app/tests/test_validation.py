def test_full_validation_and_revalidation_flow(client, user_headers):
    # 1. Create Idea
    idea_res = client.post(
        "/api/v1/ideas",
        headers=user_headers,
        json={
            "title": "AI Autonomous Code Reviewer",
            "description": "Comprehensive static code analysis platform using large language models for instant PR feedback.",
            "problem": "Manual code reviews take too long and miss edge cases.",
            "target_customer": "Software development teams and tech startups.",
            "solution": "Automated pull request review bot.",
            "industry": "Software Development"
        }
    )
    assert idea_res.status_code == 201
    idea_id = idea_res.json()["data"]["id"]

    # 2. Run Validation Pipeline (Async Task Enqueue)
    val_res = client.post(f"/api/v1/ideas/{idea_id}/validate", headers=user_headers)
    assert val_res.status_code == 200
    job_data = val_res.json()["data"]
    assert "job_id" in job_data
    assert job_data["status"] in ["PENDING", "COMPLETED"]

    # Check status endpoint
    status_res = client.get(f"/api/v1/ideas/{idea_id}/validation/status", headers=user_headers)
    assert status_res.status_code == 200
    assert status_res.json()["data"]["status"] == "COMPLETED"

    # Get validation details
    details_res = client.get(f"/api/v1/ideas/{idea_id}/validation", headers=user_headers)
    assert details_res.status_code == 200
    val_data = details_res.json()["data"]
    assert val_data["idea_id"] == idea_id
    assert val_data["version"] == 1
    assert "overall_score" in val_data
    assert "confidence_score" in val_data
    assert "classification" in val_data
    assert len(val_data["recommendations"]) > 0
    assert val_data["verification"]["passed"] is True

    # 3. Test Re-validation (Incrementing Version)
    reval_res = client.post(f"/api/v1/ideas/{idea_id}/revalidate", headers=user_headers)
    assert reval_res.status_code == 200
    reval_job = reval_res.json()["data"]
    assert "job_id" in reval_job

    # 4. Check History Endpoint (Paginated Envelope)
    hist_res = client.get(f"/api/v1/ideas/{idea_id}/history", headers=user_headers)
    assert hist_res.status_code == 200
    history_envelope = hist_res.json()["data"]
    assert history_envelope["total"] == 2
    items = history_envelope["items"]
    assert len(items) == 2
    assert items[0]["version"] == 1
    assert items[1]["version"] == 2
