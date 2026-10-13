import pytest
from app.models.idea import Idea
from app.services.validation_service import ValidationService


def test_scenario_1_vague_idea(db_session):
    validation_service = ValidationService(db_session)

    idea = Idea(
        title="Local Services",
        description="An app that connects people with local services",
        problem=None,
        solution=None,
        target_customer=None,
        business_model=None,
        user_id=1,
        version=0
    )
    db_session.add(idea)
    db_session.commit()
    db_session.refresh(idea)

    result = validation_service.run_validation_pipeline(idea.id, user_id=1)

    # Assertions
    assert result["overall_score"] < 50, f"Expected overall_score < 50, got {result['overall_score']}"
    assert result["confidence_score"] <= 40, f"Expected confidence_score <= 40, got {result['confidence_score']}"

    overrides = result.get("score_overrides", [])
    override_reasons = [o.get("reason") for o in overrides]
    assert "revenue_model_missing_score_capped" in override_reasons, (
        f"Missing revenue cap override. Got: {override_reasons}"
    )
    assert "customer_vague_score_capped" in override_reasons, (
        f"Missing customer vague cap override. Got: {override_reasons}"
    )

    gaps = result.get("information_gaps", [])
    assert len(gaps) >= 3, f"Expected at least 3 information gaps, got {len(gaps)}"


def test_scenario_2_detailed_idea(db_session):
    validation_service = ValidationService(db_session)

    idea = Idea(
        title="CloudCost: AI Cloud Infrastructure Cost Optimizer",
        description="Automated continuous cloud infrastructure cost optimization SaaS that analyzes Kubernetes clusters and AWS workloads in real-time to eliminate idle cloud spend.",
        problem="Enterprise engineering teams consistently overspend 35% on underutilized cloud compute instances and unattached storage volumes because manual tuning takes hours every week.",
        solution="An automated daemon agent that monitors Kubernetes metrics, analyzes usage telemetry with predictive ML models, and safely rightsizes AWS EC2 instances with zero downtime.",
        target_customer="DevOps and Platform Engineering leaders at mid-market B2B software companies managing over $50k monthly cloud spend.",
        revenue_model="B2B SaaS subscription tiered at $299 per month base plus 10 percent of verified monthly cloud savings.",
        business_model="B2B SaaS subscription tiered at $299 per month base plus 10 percent of verified monthly cloud savings.",
        technology="Python, FastAPI, Kubernetes API, AWS SDK, Redis, PostgreSQL",
        user_id=1,
        version=0
    )
    db_session.add(idea)
    db_session.commit()
    db_session.refresh(idea)

    result = validation_service.run_validation_pipeline(idea.id, user_id=1)

    # Assertions
    assert result["overall_score"] > 60, f"Expected overall_score > 60, got {result['overall_score']}"
    assert result["confidence_score"] >= 35, f"Expected confidence_score >= 35, got {result['confidence_score']}"

    overrides = result.get("score_overrides", [])
    override_reasons = [o.get("reason") for o in overrides]
    assert "revenue_model_missing_score_capped" not in override_reasons
    assert "customer_vague_score_capped" not in override_reasons

    assert result["classification"] in ["STRONG", "MODERATE", "PROMISING", "VIABLE"]


def test_scenario_3_discrimination(db_session):
    validation_service = ValidationService(db_session)

    # 1. Vague idea
    vague_idea = Idea(
        title="Local Services",
        description="An app that connects people with local services",
        problem=None,
        solution=None,
        target_customer=None,
        business_model=None,
        user_id=1,
        version=0
    )
    db_session.add(vague_idea)

    # 2. Detailed idea
    detailed_idea = Idea(
        title="CloudCost: AI Cloud Infrastructure Cost Optimizer",
        description="Automated continuous cloud infrastructure cost optimization SaaS that analyzes Kubernetes clusters and AWS workloads in real-time to eliminate idle cloud spend.",
        problem="Enterprise engineering teams consistently overspend 35% on underutilized cloud compute instances and unattached storage volumes because manual tuning takes hours every week.",
        solution="An automated daemon agent that monitors Kubernetes metrics, analyzes usage telemetry with predictive ML models, and safely rightsizes AWS EC2 instances with zero downtime.",
        target_customer="DevOps and Platform Engineering leaders at mid-market B2B software companies managing over $50k monthly cloud spend.",
        revenue_model="B2B SaaS subscription tiered at $299 per month base plus 10 percent of verified monthly cloud savings.",
        business_model="B2B SaaS subscription tiered at $299 per month base plus 10 percent of verified monthly cloud savings.",
        technology="Python, FastAPI, Kubernetes API, AWS SDK, Redis, PostgreSQL",
        user_id=1,
        version=0
    )
    db_session.add(detailed_idea)
    db_session.commit()

    vague_result = validation_service.run_validation_pipeline(vague_idea.id, user_id=1)
    detailed_result = validation_service.run_validation_pipeline(detailed_idea.id, user_id=1)

    vague_score = vague_result["overall_score"]
    detailed_score = detailed_result["overall_score"]
    score_diff = detailed_score - vague_score

    assert score_diff >= 15, (
        f"Pipeline must discriminate between vague and detailed ideas by at least 15 points. "
        f"Detailed: {detailed_score}, Vague: {vague_score}, Diff: {score_diff}"
    )


def test_invisible_water_idea_scores_very_low(client, user_token):
    """
    An explicitly fraudulent/nonsensical idea must score below 30.
    This test reproduces the real bug where a bad idea scored 77%.
    """
    r = client.post("/api/v1/ideas", json={
        "title": "Invisible water app",
        "description": (
            "I want to create a mobile app that sells invisible water "
            "to people for Rs 5000 per bottle. The bottle will be "
            "completely empty and customers will not receive any actual "
            "water. I have no target customers, no market research, "
            "no investment, and no business plan. I expect to earn "
            "1 crore in the first month. I do not want to market my "
            "product or explain why people should buy it."
        ),
        "target_customer": "everyone in the whole world"
    }, headers={"Authorization": f"Bearer {user_token}"})
    assert r.status_code in [200, 201]
    idea_id = r.json()["data"]["id"]

    client.post(f"/api/v1/ideas/{idea_id}/validate",
                headers={"Authorization": f"Bearer {user_token}"})

    result = client.get(f"/api/v1/ideas/{idea_id}/validation",
                        headers={"Authorization": f"Bearer {user_token}"})
    data = result.json()["data"]

    score = data["overall_score"]
    classification = data["classification"]
    overrides = data.get("score_overrides", [])

    assert score <= 30, (
        f"Fraudulent idea scored {score} — expected <= 30. "
        f"Overrides applied: {overrides}. "
        f"The L8 verification rules are not intercepting LLM scores."
    )
    assert classification in ["VERY_WEAK", "WEAK"], (
        f"Fraudulent idea classified as {classification} — "
        f"expected VERY_WEAK."
    )
    assert len(overrides) >= 2, (
        f"Expected at least 2 verification overrides for this idea. "
        f"Got: {overrides}. Rules are not firing."
    )
