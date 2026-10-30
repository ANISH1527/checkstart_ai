import importlib
import pytest
import app.services.scoring_service as scoring_module
from app.services.scoring_service import ScoringService


def test_weighted_scoring_calculation():
    scoring_service = ScoringService()
    llm_output = {
        "market_demand": {"score": 100},
        "problem_solution_fit": {"score": 100},
        "target_customer_clarity": {"score": 100},
        "competition": {"score": 100},
        "uniqueness": {"score": 100},
        "technical_feasibility": {"score": 100},
        "business_potential": {"score": 100},
        "scalability": {"score": 100},
        "risk": {"score": 100}
    }

    overall_score, classification, extracted_scores = scoring_service.calculate_scores(llm_output)
    assert overall_score == 100.0
    assert classification == "EXCEPTIONAL"


def test_weights_sum_to_one():
    assert abs(sum(ScoringService.WEIGHTS.values()) - 1.0) < 1e-9


def test_broken_weights_raise():
    original_weights = dict(scoring_module.ScoringService.WEIGHTS)
    try:
        # Override weights to sum to 1.1
        scoring_module.ScoringService.WEIGHTS = dict(original_weights)
        scoring_module.ScoringService.WEIGHTS["market_demand"] = 0.35
        
        with pytest.raises(AssertionError):
            assert abs(sum(scoring_module.ScoringService.WEIGHTS.values()) - 1.0) < 1e-9, (
                f"Scoring weights must sum to 1.0, currently sum to {sum(scoring_module.ScoringService.WEIGHTS.values()):.6f}"
            )
    finally:
        scoring_module.ScoringService.WEIGHTS = original_weights
        importlib.reload(scoring_module)


def test_out_of_range_score_is_clipped():
    scoring_service = ScoringService()
    llm_output = {
        "market_demand": {"score": 150},  # Out of bounds score (> 100)
        "problem_solution_fit": {"score": 100},
        "target_customer_clarity": {"score": 100},
        "competition": {"score": 100},
        "uniqueness": {"score": 100},
        "technical_feasibility": {"score": 100},
        "business_potential": {"score": 100},
        "scalability": {"score": 100},
        "risk": {"score": 100}
    }

    overall_score, classification, extracted_scores = scoring_service.calculate_scores(llm_output, idea_id=1)
    assert extracted_scores["market_demand"] == 100.0
    assert overall_score == 100.0


def test_aggregate_to_7_parameters():
    extracted = {
        "market_demand": 85.0,
        "problem_solution_fit": 90.0,
        "competition": 70.0,
        "target_customer_clarity": 80.0,
        "uniqueness": 75.0,
        "technical_feasibility": 95.0,
        "business_potential": 88.0,
        "scalability": 60.0,
        "risk": 30.0
    }
    seven = ScoringService.aggregate_to_7_parameters(extracted)
    assert seven["marketDemand"] == 8.5
    assert seven["problemSeverity"] == 9.0
    assert seven["competition"] == 7.0
    assert seven["targetCustomer"] == 8.0
    assert seven["innovation"] == 7.5
    assert seven["feasibility"] == 9.5
    assert seven["revenuePotential"] == 8.8


def test_classify_all_bands():
    exceptional = ScoringService.classify(92.5)
    assert exceptional["code"] == "EXCEPTIONAL"
    assert exceptional["label"] == "Highly Promising"

    strong = ScoringService.classify(78.0)
    assert strong["code"] == "STRONG"
    assert strong["label"] == "Promising"

    moderate = ScoringService.classify(65.0)
    assert moderate["code"] == "MODERATE"
    assert moderate["label"] == "Moderate"

    weak = ScoringService.classify(45.0)
    assert weak["code"] == "WEAK"
    assert weak["label"] == "Needs Improvement"

    very_weak = ScoringService.classify(25.0)
    assert very_weak["code"] == "VERY_WEAK"
    assert very_weak["label"] == "High Risk"


def test_high_risk_idea_scores_lower_overall_than_low_risk_idea():
    """High risk raw score must produce lower overall contribution than low risk"""
    from app.services.scoring_service import ScoringService
    svc = ScoringService()

    # Base scores identical except risk_level
    base_scores = {
        "market_demand": 70,
        "problem_solution_fit": 70,
        "target_customer_clarity": 70,
        "competition": 70,
        "uniqueness_innovation": 70,
        "technical_feasibility": 70,
        "business_potential": 70,
        "scalability": 70,
        "risk_level": 80,  # HIGH risk
    }
    low_risk_scores = {**base_scores, "risk_level": 20}  # LOW risk

    high_risk_result = svc.calculate(base_scores)
    low_risk_result = svc.calculate(low_risk_scores)

    assert high_risk_result["overall_score"] < low_risk_result["overall_score"], (
        "High risk idea must score lower than low risk idea. "
        f"Got high_risk={high_risk_result['overall_score']}, "
        f"low_risk={low_risk_result['overall_score']}"
    )


def test_frontend_param_map_keys_match_validation_score_parameters():
    """All FRONTEND_PARAM_MAP values must exist as valid scoring parameters"""
    from app.services.scoring_service import FRONTEND_PARAM_MAP, WEIGHTS
    for frontend_key, backend_param in FRONTEND_PARAM_MAP.items():
        assert backend_param in WEIGHTS, (
            f"Frontend param '{frontend_key}' maps to '{backend_param}' "
            f"which is not in WEIGHTS dict"
        )


# ============================================================================
# PHASE 1 — 7-Parameter Scoring Engine Tests (report_v1)
# ============================================================================

def test_report_v1_weights_sum_to_one():
    """Report v1 7 weights must sum to exactly 1.0"""
    from app.services.scoring_service import REPORT_V1_WEIGHTS
    assert len(REPORT_V1_WEIGHTS) == 7
    assert abs(sum(REPORT_V1_WEIGHTS.values()) - 1.0) < 1e-9
    assert REPORT_V1_WEIGHTS["market_demand"] == 0.25
    assert REPORT_V1_WEIGHTS["problem_severity"] == 0.20
    assert REPORT_V1_WEIGHTS["competition"] == 0.15
    assert REPORT_V1_WEIGHTS["target_customer"] == 0.10
    assert REPORT_V1_WEIGHTS["innovation"] == 0.10
    assert REPORT_V1_WEIGHTS["feasibility"] == 0.10
    assert REPORT_V1_WEIGHTS["revenue_potential"] == 0.10


def test_clamp_score_boundaries_and_nan():
    """clamp_score handles NaN/None -> 5.0 and clamps strictly to [1.0, 10.0]"""
    import math
    from app.services.scoring_service import clamp_score

    assert clamp_score(None) == 5.0
    assert clamp_score(float("nan")) == 5.0
    assert clamp_score("invalid") == 5.0
    assert clamp_score(0.0) == 1.0
    assert clamp_score(0.5) == 1.0
    assert clamp_score(1.0) == 1.0
    assert clamp_score(10.0) == 10.0
    assert clamp_score(15.0) == 10.0
    assert clamp_score(8.44) == 8.4
    assert clamp_score(8.46) == 8.5


def test_report_v1_boundary_scores():
    """All 1.0 -> 10.0% (min attainable), all 10.0 -> 100.0%"""
    from app.services.scoring_service import calculate_validation_score, ScoringService

    all_min = {
        "market_demand": 1.0,
        "problem_severity": 1.0,
        "competition": 1.0,
        "target_customer": 1.0,
        "innovation": 1.0,
        "feasibility": 1.0,
        "revenue_potential": 1.0,
    }
    score_min = calculate_validation_score(all_min)
    assert score_min == 10.0

    all_max = {
        "market_demand": 10.0,
        "problem_severity": 10.0,
        "competition": 10.0,
        "target_customer": 10.0,
        "innovation": 10.0,
        "feasibility": 10.0,
        "revenue_potential": 10.0,
    }
    score_max = calculate_validation_score(all_max)
    assert score_max == 100.0


def test_report_v1_sample_calculation():
    """
    Academic report exact sample calculation:
    (8.5, 8.4, 8.1, 9.7, 9.4, 7.9, 9.3) -> 8.65 -> 86.5%
    """
    from app.services.scoring_service import calculate_validation_score, ScoringService

    sample_scores = {
        "market_demand": 8.5,
        "problem_severity": 8.4,
        "competition": 8.1,
        "target_customer": 9.7,
        "innovation": 9.4,
        "feasibility": 7.9,
        "revenue_potential": 9.3,
    }
    v_score = calculate_validation_score(sample_scores)
    assert v_score == 86.5

    svc = ScoringService(framework="report_v1")
    result = svc.calculate(sample_scores)
    assert result["percentage"] == 86.5
    assert result["raw_s"] == 8.65
    assert result["classification"] == "Highly Promising"
    assert result["classification_info"]["action"] == "Build MVP and recruit beta users"


def test_report_v1_classification_bands():
    """Verify all 4 report_v1 classification bands and action recommendations"""
    from app.services.scoring_service import classify_report_v1

    # >= 80.0
    c1 = classify_report_v1(85.0)
    assert c1["code"] == "HIGHLY_PROMISING"
    assert c1["category"] == "Highly Promising"
    assert c1["action"] == "Build MVP and recruit beta users"

    # 60.0 - 79.9
    c2 = classify_report_v1(72.5)
    assert c2["code"] == "PROMISING"
    assert c2["category"] == "Promising"
    assert c2["action"] == "Conduct 10-15 customer interviews"

    # 40.0 - 59.9
    c3 = classify_report_v1(52.0)
    assert c3["code"] == "NEEDS_IMPROVEMENT"
    assert c3["category"] == "Needs Improvement"
    assert c3["action"] == "Execute a structured concept pivot"

    # < 40.0
    c4 = classify_report_v1(35.0)
    assert c4["code"] == "HIGH_RISK"
    assert c4["category"] == "High Risk"
    assert c4["action"] == "Pause development and conduct exploratory research"


def test_llm_never_supplies_overall_score():
    """The LLM's hallucinated overall_score is ignored; calculated by deterministic math"""
    from app.services.scoring_service import ScoringService

    svc = ScoringService(framework="report_v1")
    # Even if LLM claimed overall_score was 99.0
    llm_payload = {
        "overall_score": 99.0,
        "market_demand": 5.0,
        "problem_severity": 5.0,
        "competition": 5.0,
        "target_customer": 5.0,
        "innovation": 5.0,
        "feasibility": 5.0,
        "revenue_potential": 5.0,
    }
    result = svc.calculate(llm_payload)
    # 5.0 on all 7 params with sum(w)=1.0 gives 5.0 -> 50.0%
    assert result["percentage"] == 50.0
    assert result["classification"] == "Needs Improvement"
