import pytest
from app.models.idea import Idea
from app.services.validation_service import ValidationService
from app.services.idea_profile_service import IdeaProfileExtractor


def test_idea_profile_extraction_differentiation():
    extractor = IdeaProfileExtractor()

    test_a_dict = {
        "title": "Student App",
        "description": "I want to create an app for students."
    }

    test_b_dict = {
        "title": "College Student Homemade Food Marketplace",
        "description": "I want to build a mobile platform that connects college students with verified local home cooks who provide affordable homemade meals. Students can browse daily menus, compare prices, place orders, and schedule deliveries. Home cooks can register, upload menus, and manage orders. The target customers are college students living away from home. The platform will generate revenue through a 10% commission on each order and optional delivery fees. Initially, I want to launch in Erode and later expand to other college towns in Tamil Nadu."
    }

    profile_a = extractor.extract_profile(test_a_dict)
    profile_b = extractor.extract_profile(test_b_dict)

    # 1. Test completeness score differs significantly
    assert profile_a.is_vague is True
    assert profile_b.is_vague is False
    assert profile_a.completeness_score < 30.0
    assert profile_b.completeness_score > 60.0

    # 2. Test extraction of explicit & implicit fields
    assert profile_a.problem is None
    assert profile_b.target_customer == "college students living away from home"
    assert profile_b.location == "Erode, Tamil Nadu, college towns"
    assert profile_b.supply_side == "verified local home cooks"
    assert profile_b.revenue_model == "10% commission"


def test_full_pipeline_intelligence_differentiation(db_session):
    from app.models.user import User

    test_user = User(name="Test Founder", email="founder@example.com", password_hash="hashed_password_123")
    db_session.add(test_user)
    db_session.commit()
    db_session.refresh(test_user)

    val_service = ValidationService(db_session)

    # Create Idea A (Vague)
    idea_a = Idea(
        user_id=test_user.id,
        title="Student App",
        description="I want to create an app for students."
    )
    db_session.add(idea_a)
    db_session.commit()
    db_session.refresh(idea_a)

    # Create Idea B (Detailed)
    idea_b = Idea(
        user_id=test_user.id,
        title="College Student Homemade Food Marketplace",
        description="I want to build a mobile platform that connects college students with verified local home cooks who provide affordable homemade meals. Students can browse daily menus, compare prices, place orders, and schedule deliveries. Home cooks can register, upload menus, and manage orders. The target customers are college students living away from home. The platform will generate revenue through a 10% commission on each order and optional delivery fees. Initially, I want to launch in Erode and later expand to other college towns in Tamil Nadu."
    )
    db_session.add(idea_b)
    db_session.commit()
    db_session.refresh(idea_b)

    # Run validation pipelines
    res_a = val_service.run_validation_pipeline(idea_a)
    res_b = val_service.run_validation_pipeline(idea_b)

    # 1. Overall scores & confidence scores differ
    assert res_a["confidence_score"] < 40.0
    from app.core.config import settings
    if settings.LLM_PROVIDER == "mock":
        assert res_b["confidence_score"] >= 35.0
    else:
        assert res_b["confidence_score"] > 65.0
    assert res_a["confidence_score"] != res_b["confidence_score"]

    assert res_a["overall_score"] < 45.0, f"Scores: {res_a['detailed_scores']}"
    assert res_b["overall_score"] > 65.0

    # 2. Strengths differ and Vague idea does NOT get "Clear core concept definition"
    assert "Clear core concept definition" not in res_a["strengths"]
    assert res_a["strengths"] != res_b["strengths"]
    assert any("target customer" in s.lower() or "marketplace" in s.lower() for s in res_b["strengths"])

    # 3. Weaknesses & Information Gaps differ
    assert res_a["weaknesses"] != res_b["weaknesses"]
    assert res_a["information_gaps"] != res_b["information_gaps"]

    # Idea A gaps focus on missing problem/customer/monetization
    gap_cats_a = [g["category"] for g in res_a["information_gaps"]]
    assert "PROBLEM_DEFINITION" in gap_cats_a or "TARGET_CUSTOMER" in gap_cats_a

    # Idea B gaps focus on pricing/compliance/unit economics
    gap_cats_b = [g["category"] for g in res_b["information_gaps"]]
    assert "WILLINGNESS_TO_PAY" in gap_cats_b or "REGULATORY_COMPLIANCE" in gap_cats_b or "UNIT_ECONOMICS" in gap_cats_b

    # 4. Recommendations differ
    rec_cats_a = [r["category"] for r in res_a["recommendations"]]
    rec_cats_b = [r["category"] for r in res_b["recommendations"]]
    assert rec_cats_a != rec_cats_b
    assert any(cat in rec_cats_a for cat in ["PROBLEM_DISCOVERY", "CUSTOMER_DEFINITION", "TARGET_CUSTOMER_CLARITY", "PROBLEM_SOLUTION_FIT"])
    assert len(rec_cats_b) > 0

    # 5. Parameter scores and status differ
    score_details_a = {s["parameter"]: s for s in res_a["score_details"]}
    score_details_b = {s["parameter"]: s for s in res_b["score_details"]}

    assert score_details_a["target_customer_clarity"]["status"] == "PARTIALLY_SUPPORTED" or score_details_a["target_customer_clarity"]["status"] == "INSUFFICIENT_INFORMATION"
    assert score_details_b["target_customer_clarity"]["status"] == "SUPPORTED"
    assert score_details_a["target_customer_clarity"]["confidence"] < score_details_b["target_customer_clarity"]["confidence"]
