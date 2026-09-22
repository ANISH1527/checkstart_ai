def test_idea_crud(client, user_headers):
    # Create Idea
    create_res = client.post(
        "/api/v1/ideas",
        headers=user_headers,
        json={
            "title": "AI Legal Assistant",
            "description": "Automated contract review tool for small businesses.",
            "problem": "Legal consulting is expensive.",
            "target_customer": "SME founders",
            "solution": "AI contract analyzer",
            "industry": "LegalTech"
        }
    )
    assert create_res.status_code == 201
    idea_id = create_res.json()["data"]["id"]

    # Read Idea
    get_res = client.get(f"/api/v1/ideas/{idea_id}", headers=user_headers)
    assert get_res.status_code == 200
    assert get_res.json()["data"]["title"] == "AI Legal Assistant"

    # List Ideas
    list_res = client.get("/api/v1/ideas", headers=user_headers)
    assert list_res.status_code == 200
    assert len(list_res.json()["data"]["items"]) == 1

    # Update Idea
    update_res = client.put(
        f"/api/v1/ideas/{idea_id}",
        headers=user_headers,
        json={"title": "AI Legal Pro"}
    )
    assert update_res.status_code == 200
    assert update_res.json()["data"]["title"] == "AI Legal Pro"

    # Delete Idea
    del_res = client.delete(f"/api/v1/ideas/{idea_id}", headers=user_headers)
    assert del_res.status_code == 204
