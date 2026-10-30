import pytest
from app.services.report_service import ReportService


def test_markdown_report_score_formatting():
    service = ReportService()
    validation_data = {
        "version": 1,
        "overall_score": 77.0,
        "classification": "Promising",
        "confidence_score": 85.0,
        "detailed_scores": [
            {"parameter": "market_demand", "score": 82.0},
            {"parameter": "problem_solution_fit", "score": 85.0},
            {"parameter": "target_customer_clarity", "score": 88.0},
            {"parameter": "uniqueness_innovation", "score": 40.0},
            {"parameter": "technical_feasibility", "score": 64.0},
            {"parameter": "business_potential", "score": 100.0},
            {"parameter": "scalability", "score": 0.0},
            {"parameter": "risk_level", "score": 3.5},  # Already 0-10 scale
        ],
        "recommendations": []
    }

    report = service.generate_markdown_report(validation_data)

    # Check overall score formatting
    assert "**Overall Validation Score:** 77% (7.7/10)" in report

    # Check parameter breakdowns divided by 10 with one decimal place
    assert "- **Market Demand:** 8.2/10" in report
    assert "- **Problem-Solution Fit:** 8.5/10" in report
    assert "- **Target Customer Clarity:** 8.8/10" in report
    assert "- **Uniqueness & Innovation:** 4.0/10" in report
    assert "- **Technical Feasibility:** 6.4/10" in report
    assert "- **Business Potential:** 10.0/10" in report
    assert "- **Scalability:** 0.0/10" in report
    # Already 0-10 scale should not be divided again
    assert "- **Risk Level:** 3.5/10" in report


def test_markdown_report_already_normalized_overall():
    service = ReportService()
    validation_data = {
        "version": 2,
        "overallScore": 7.7,
        "classification": "Promising",
        "confidence_score": 85.0,
        "scores": {
            "market_demand": 8.2,
            "problem_solution_fit": 8.5,
        }
    }

    report = service.generate_markdown_report(validation_data)
    assert "**Overall Validation Score:** 77% (7.7/10)" in report
    assert "- **Market Demand:** 8.2/10" in report
    assert "- **Problem-Solution Fit:** 8.5/10" in report
