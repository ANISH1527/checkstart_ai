from app.services.confidence_service import ConfidenceService


def test_confidence_formula_bounds():
    confidence_service = ConfidenceService()
    idea_data = {
        "title": "Complete Idea",
        "description": "Very long description text here with detailed insights.",
        "problem": "Detailed problem",
        "target_customer": "SMEs",
        "solution": "Software",
        "industry": "Tech",
        "business_model": "SaaS",
        "revenue_model": "Subscriptions",
        "pricing": "$99/mo",
        "technology": "Python"
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
    evidence = [{"reliability": "HIGH"}]
    rules = [{"passed": True}]

    conf = confidence_service.calculate_confidence(idea_data, llm_output, evidence, rules)
    assert 0.0 <= conf <= 100.0
    assert conf > 70.0
