import pytest
from unittest.mock import patch, MagicMock
import httpx
from app.models.validation import ValidationResult
from app.services.embedding_service import EmbeddingService, cache_service
import redis


def test_task5_soft_and_hard_delete_rbac(client, user_headers, admin_headers):
    # Create an idea
    idea_res = client.post(
        "/api/v1/ideas",
        headers=user_headers,
        json={"title": "Delete Test Idea", "description": "Idea to be deleted test."}
    )
    idea_id = idea_res.json()["data"]["id"]

    # Standard user attempting hard delete should be forbidden (403)
    hard_del_res = client.delete(f"/api/v1/ideas/{idea_id}?hard=true", headers=user_headers)
    assert hard_del_res.status_code == 403

    # Standard soft delete (204)
    soft_del_res = client.delete(f"/api/v1/ideas/{idea_id}", headers=user_headers)
    assert soft_del_res.status_code == 204

    # Soft deleted idea should not be returned in GET
    get_res = client.get(f"/api/v1/ideas/{idea_id}", headers=user_headers)
    assert get_res.status_code == 404

    # Hard delete by admin should succeed (204)
    hard_del_admin = client.delete(f"/api/v1/ideas/{idea_id}?hard=true", headers=admin_headers)
    assert hard_del_admin.status_code == 204


def test_task2_input_validation_and_ownership(client, user_headers):
    # 1. Register second user for ownership check
    client.post(
        "/api/v1/auth/register",
        json={"name": "User 2", "email": "u2_owner@example.com", "password": "Password123!"}
    )
    u2_login = client.post(
        "/api/v1/auth/login",
        data={"username": "u2_owner@example.com", "password": "Password123!"}
    )
    user2_headers = {"Authorization": f"Bearer {u2_login.json()['data']['access_token']}"}

    # 1. Input validation: oversized description (> 5000 chars)
    huge_desc = "A" * 5001
    bad_res = client.post(
        "/api/v1/ideas",
        headers=user_headers,
        json={"title": "Huge Idea", "description": huge_desc}
    )
    assert bad_res.status_code == 422

    # 2. Ownership isolation: user2 cannot view user1's idea
    ok_res = client.post(
        "/api/v1/ideas",
        headers=user_headers,
        json={"title": "Private Idea", "description": "Private description."}
    )
    idea_id = ok_res.json()["data"]["id"]

    u2_get = client.get(f"/api/v1/ideas/{idea_id}", headers=user2_headers)
    assert u2_get.status_code == 404


def test_task1_async_queue_and_status(client, user_headers):
    idea_res = client.post(
        "/api/v1/ideas",
        headers=user_headers,
        json={"title": "Async Idea", "description": "Testing async task queue integration."}
    )
    idea_id = idea_res.json()["data"]["id"]

    val_res = client.post(f"/api/v1/ideas/{idea_id}/validate", headers=user_headers)
    assert val_res.status_code == 200
    data = val_res.json()["data"]
    assert "job_id" in data
    assert data["status"] in ["PENDING", "COMPLETED"]

    status_res = client.get(f"/api/v1/ideas/{idea_id}/validation/status", headers=user_headers)
    assert status_res.status_code == 200
    assert status_res.json()["data"]["status"] == "COMPLETED"


def test_task3_health_metrics_timing(client, admin_headers):
    # Health check
    h_res = client.get("/health")
    assert h_res.status_code == 200
    assert h_res.json()["data"]["status"] == "ok"

    m_res = client.get("/api/v1/admin/metrics", headers=admin_headers)
    assert m_res.status_code == 200
    metrics = m_res.json()["data"]
    assert "total_validations" in metrics
    assert "avg_pipeline_duration_ms" in metrics


def test_task4_prompt_version_and_llm(client, db_session, user_headers):
    idea_res = client.post(
        "/api/v1/ideas",
        headers=user_headers,
        json={"title": "LLM Version Test", "description": "Checking prompt version storage."}
    )
    idea_id = idea_res.json()["data"]["id"]

    client.post(f"/api/v1/ideas/{idea_id}/validate", headers=user_headers)

    val_rec = db_session.query(ValidationResult).filter(ValidationResult.idea_id == idea_id).first()
    assert val_rec is not None
    assert val_rec.prompt_version == "v1.2"
    assert val_rec.pipeline_timing is not None


def test_task6_pagination_and_version_comparison(client, user_headers):
    idea_res = client.post(
        "/api/v1/ideas",
        headers=user_headers,
        json={"title": "Version Comp Idea", "description": "Testing arbitrary version comparison."}
    )
    idea_id = idea_res.json()["data"]["id"]

    # Version 1
    client.post(f"/api/v1/ideas/{idea_id}/validate", headers=user_headers)
    # Version 2
    client.post(f"/api/v1/ideas/{idea_id}/revalidate", headers=user_headers)

    # Test paginated history
    hist_res = client.get(f"/api/v1/ideas/{idea_id}/history?limit=1&offset=0", headers=user_headers)
    assert hist_res.status_code == 200
    hist_data = hist_res.json()["data"]
    assert hist_data["total"] == 2
    assert len(hist_data["items"]) == 1
    assert hist_data["has_more"] is True

    # Test comparison v1=1 & v2=2
    comp_res = client.get(f"/api/v1/ideas/{idea_id}/comparison?v1=1&v2=2", headers=user_headers)
    assert comp_res.status_code == 200
    comp_data = comp_res.json()["data"]
    assert comp_data["has_comparison"] is True
    assert "v1_version" in comp_data
    assert "v2_version" in comp_data


def test_embedding_cache_hit():
    service = EmbeddingService()
    text = "Identical test idea for embedding cache"

    fake_redis_store = {}

    def fake_get(k):
        return fake_redis_store.get(k)

    def fake_set(k, v, ex=None):
        fake_redis_store[k] = v

    mock_redis = MagicMock()
    mock_redis.get.side_effect = fake_get
    mock_redis.set.side_effect = fake_set

    with patch.object(cache_service, "_redis_client", mock_redis):
        with patch.object(service, "_compute_embedding", wraps=service._compute_embedding) as mock_compute:
            vec1 = service.generate_embedding(text)
            vec2 = service.generate_embedding(text)

            assert vec1 == vec2
            assert mock_compute.call_count == 1


def test_embedding_cache_miss_on_new_text():
    service = EmbeddingService()
    text1 = "Unique test idea text 1"
    text2 = "Unique test idea text 2"

    with patch.object(service, "_compute_embedding", wraps=service._compute_embedding) as mock_compute:
        service.generate_embedding(text1)
        service.generate_embedding(text2)

        assert mock_compute.call_count == 2


def test_cache_unavailable_falls_back():
    service = EmbeddingService()
    text = "Fallback test idea text"

    with patch("redis.Redis.from_url", side_effect=redis.ConnectionError("Redis connection failed")):
        vec = service.generate_embedding(text)
        assert isinstance(vec, list)
        assert len(vec) > 0


# --- GAP 3: Rate limit & Validation Error response shapes ---

def test_rate_limit_returns_error_response_shape(client):
    from app.core.limiter import limiter
    limiter.enabled = True
    try:
        r = None
        for _ in range(6):
            r = client.post("/api/v1/auth/login", data={"username": "x@x.com", "password": "wrong"})
        assert r.status_code == 429
        body = r.json()
        assert body["success"] is False
        assert body["error"] == "rate_limit_exceeded"
        assert "retry_after_seconds" in body.get("details", {})
    finally:
        limiter.enabled = False


def test_validation_error_returns_error_response_shape(client, user_token):
    headers = {"Authorization": f"Bearer {user_token}"} if isinstance(user_token, str) else user_token
    # Send idea with description exceeding 5000 char limit
    r = client.post("/api/v1/ideas",
                    json={"title": "T", "description": "x" * 5001},
                    headers=headers)
    assert r.status_code == 422
    body = r.json()
    assert body["success"] is False
    assert body["error"] == "validation_error"
    assert "description" in body.get("details", {})


# --- GAP 4: Multi-tenant isolation ---

def test_user_cannot_access_another_users_idea(client, user_token, admin_token, seed_idea):
    idea_id = seed_idea["id"] if isinstance(seed_idea, dict) else seed_idea
    user2_headers = {"Authorization": f"Bearer {admin_token}"} if isinstance(admin_token, str) else admin_token

    r = client.get(f"/api/v1/ideas/{idea_id}", headers=user2_headers)
    assert r.status_code in [403, 404]
    assert r.json()["success"] is False


def test_user_cannot_validate_another_users_idea(client, user_token, admin_token, seed_idea):
    idea_id = seed_idea["id"] if isinstance(seed_idea, dict) else seed_idea
    user2_headers = {"Authorization": f"Bearer {admin_token}"} if isinstance(admin_token, str) else admin_token

    r = client.post(f"/api/v1/ideas/{idea_id}/validate", headers=user2_headers)
    assert r.status_code in [403, 404]
    assert r.json()["success"] is False


# --- GAP 6: Webhook fires and retries ---

def test_webhook_fires_after_validation_completes(client, user_token, db):
    headers = {"Authorization": f"Bearer {user_token}"} if isinstance(user_token, str) else user_token
    r = client.post("/api/v1/ideas",
                    json={
                        "title": "Webhook test idea",
                        "description": "Test idea for webhook verification " * 10,
                        "webhook_url": "https://example.com/hook"
                    },
                    headers=headers)
    idea_id = r.json()["data"]["id"]

    with patch("httpx.post") as mock_post:
        mock_post.return_value = MagicMock(status_code=200)
        client.post(f"/api/v1/ideas/{idea_id}/validate", headers=headers)

        assert mock_post.called
        call_kwargs = mock_post.call_args
        payload = call_kwargs[1].get("json") or call_kwargs[0][1]
        assert payload["idea_id"] == idea_id
        assert payload["status"] == "COMPLETED"
        assert "overall_score" in payload


def test_webhook_retries_on_failure(client, user_token):
    headers = {"Authorization": f"Bearer {user_token}"} if isinstance(user_token, str) else user_token
    r = client.post("/api/v1/ideas",
                    json={
                        "title": "Retry test",
                        "description": "Retry webhook test idea " * 10,
                        "webhook_url": "https://example.com/hook"
                    },
                    headers=headers)
    idea_id = r.json()["data"]["id"]

    with patch("httpx.post") as mock_post:
        mock_post.return_value = MagicMock(status_code=500)
        client.post(f"/api/v1/ideas/{idea_id}/validate", headers=headers)

        # Should retry 3 times total
        assert mock_post.call_count == 3
