from app.services.confidence_service import ConfidenceService


def test_confidence_formula_bounds(monkeypatch):
    monkeypatch.setattr("app.core.config.settings.LLM_PROVIDER", "openai")
    confidence_service = ConfidenceService()
    idea_data = {
        "title": "Complete Idea Platform",
        "description": "Comprehensive enterprise workflow automation and analytics software suite designed to eliminate operational bottlenecks, optimize resource allocation, and provide actionable real-time dashboard reporting for cross-functional corporate teams managing high volume projects.",
        "problem": "Enterprise teams waste hundreds of hours manually coordinating projects across disjointed legacy systems without centralized tracking.",
        "target_customer": "Mid-market to enterprise operations directors and VP-level project leaders across technology and finance sectors.",
        "solution": "An automated cloud platform combining workflow orchestration, rule-based alerts, and real-time operational analytics.",
        "industry": "Enterprise Software",
        "business_model": "B2B SaaS tiered annual subscription",
        "revenue_model": "Annual enterprise license per seat",
        "pricing": "$99 per user per month billed annually",
        "technology": "Python, FastAPI, React, PostgreSQL, Redis, Kubernetes"
    }
    llm_output = {
        "market_demand": {"confidence": 90},
        "problem_solution_fit": {"confidence": 90},
        "target_customer_clarity": {"confidence": 90},
        "competition": {"confidence": 90},
        "uniqueness": {"confidence": 90},
        "technical_feasibility": {"confidence": 90},
        "business_potential": {"confidence": 90},
        "scalability": {"confidence": 90},
        "risk": {"confidence": 90}
    }
    evidence = [{"reliability": "VERIFIED"}]
    rules = [{"passed": True}]

    conf = confidence_service.calculate_confidence(idea_data, llm_output, evidence, rules)
    assert 0.0 <= conf <= 100.0
    assert conf > 70.0
