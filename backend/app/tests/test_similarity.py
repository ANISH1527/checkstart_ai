import pytest
from app.services.similarity_service import SimilarityService
from app.services.rule_service import RuleService


def test_cosine_similarity_calculation():
    sim_service = SimilarityService(threshold=0.85)

    vec_a = [1.0, 0.0, 0.0]
    vec_b = [1.0, 0.0, 0.0]
    vec_c = [0.0, 1.0, 0.0]

    assert sim_service.cosine_similarity(vec_a, vec_b) == 1.0
    assert sim_service.cosine_similarity(vec_a, vec_c) == 0.0


def test_identical_idea_returns_high_similarity():
    sim_service = SimilarityService(threshold=0.85)
    vec = [0.5, 0.5, 0.5, 0.5]
    candidate = {
        "id": 1,
        "title": "Autonomous AI Agent for Code Review",
        "description": "Autonomous AI agent doing PR review and code scanning",
        "user_id": 99,
        "embedding": vec
    }
    result = sim_service.find_similar_ideas(
        target_vec=vec,
        candidate_ideas=[candidate],
        idea_text="Autonomous AI agent doing PR review",
        target_user_id=1
    )
    assert result["max_similarity"] >= 0.85
    assert result["similar_ideas"][0]["overlap_level"] == "HIGH"
    assert result["recommendation"] == "HIGH_OVERLAP"


def test_different_domain_ideas_return_low_similarity():
    sim_service = SimilarityService(threshold=0.85)
    target_vec = [1.0, 0.0, 0.0, 0.0]
    candidate = {
        "id": 2,
        "title": "Fresh Farm Organic Milk Delivery",
        "description": "Delivering fresh organic milk and dairy to homes daily",
        "user_id": 99,
        "embedding": [0.0, 1.0, 0.0, 0.0]
    }
    result = sim_service.find_similar_ideas(
        target_vec=target_vec,
        candidate_ideas=[candidate],
        idea_text="AI SaaS for Code Security",
        target_user_id=1
    )
    assert result["max_similarity"] == 0.0
    assert result["similar_ideas"][0]["overlap_level"] == "LOW"
    assert result["recommendation"] == "UNIQUE"


def test_same_user_high_similarity_does_not_fire_warning_rule():
    sim_service = SimilarityService(threshold=0.85)
    rule_service = RuleService()

    vec = [0.6, 0.8, 0.0]
    # Candidate owned by user 42
    candidate = {
        "id": 10,
        "title": "Earlier Draft of My Product",
        "description": "Developer platform tooling for smart automated testing",
        "user_id": 42,
        "embedding": vec
    }
    # Current idea is also by user 42
    sim_results = sim_service.find_similar_ideas(
        target_vec=vec,
        candidate_ideas=[candidate],
        idea_text="Developer platform tooling for smart automated testing",
        target_user_id=42
    )

    assert sim_results["similar_ideas"][0]["is_same_user"] is True
    # Recommendation should NOT be HIGH_OVERLAP because it's the same user
    assert sim_results["recommendation"] != "HIGH_OVERLAP"

    # Rule engine check
    idea_data = {
        "title": "Draft 2",
        "description": "Developer platform tooling for smart automated testing with new features",
        "problem": "Software testing takes too much manual intervention and effort.",
        "target_customer": "Enterprise software QA engineers and full stack engineering teams.",
        "solution": "End-to-end automated testing agents using headless browsers."
    }
    rules = rule_service.evaluate_rules(idea_data, sim_results)
    sim_rule = next((r for r in rules if r["rule"] == "HIGH_SIMILARITY_WARNING"), None)
    assert sim_rule is not None
    assert sim_rule["passed"] is True, "Same user iterating should not fail similarity rule"


def test_different_user_high_similarity_fires_warning_rule():
    sim_service = SimilarityService(threshold=0.85)
    rule_service = RuleService()

    vec = [0.6, 0.8, 0.0]
    # Candidate owned by user 999
    candidate = {
        "id": 20,
        "title": "Competitor Platform",
        "description": "Developer platform tooling for automated testing",
        "user_id": 999,
        "embedding": vec
    }
    # Current idea is by user 42
    sim_results = sim_service.find_similar_ideas(
        target_vec=vec,
        candidate_ideas=[candidate],
        idea_text="Developer platform tooling for automated testing",
        target_user_id=42
    )

    assert sim_results["similar_ideas"][0]["is_same_user"] is False
    assert sim_results["recommendation"] == "HIGH_OVERLAP"

    idea_data = {
        "title": "My Platform",
        "description": "Developer platform tooling for automated testing",
        "problem": "Software testing takes too much manual intervention.",
        "target_customer": "Enterprise software QA engineers.",
        "solution": "End-to-end automated testing agents."
    }
    rules = rule_service.evaluate_rules(idea_data, sim_results)
    sim_rule = next((r for r in rules if r["rule"] == "HIGH_SIMILARITY_WARNING"), None)
    assert sim_rule is not None
    assert sim_rule["passed"] is False, "Different user high similarity must fail similarity rule"
    assert sim_rule["severity"] == "HIGH"


def test_shared_keywords_extracted_correctly():
    sim_service = SimilarityService()
    text_a = "An autonomous developer security intelligence platform for enterprise cloud deployments"
    text_b = "Security intelligence software for enterprise developer teams"

    keywords = sim_service._extract_shared_keywords(text_a, text_b, top_n=5)
    assert "intelligence" in keywords
    assert "enterprise" in keywords
    assert "developer" in keywords
    assert "security" in keywords
    assert len(keywords) <= 5
