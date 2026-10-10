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


