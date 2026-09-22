import pytest
from app.services.root_cause_service import RootCauseService
from app.services.improvement_strategy_service import ImprovementStrategyService
from app.services.action_prioritization_service import ActionPrioritizationService
from app.services.improvement_impact_service import ImprovementImpactService
from app.services.recommendation_engine_service import RecommendationEngineService
from app.services.idea_profile_service import IdeaProfileExtractor
from app.services.scoring_service import ScoringService
from app.schemas.recommendation import StructuredRecommendation, ParameterRootCause


def test_1_root_cause_generation():
    service = RootCauseService()
    scores = {"business_potential": 42.0, "market_demand": 75.0}
    idea_dict = {"title": "Test Idea", "pricing": "None"}
    extractor = IdeaProfileExtractor()
    profile = extractor.extract_profile(idea_dict)

    causes = service.analyze_root_causes(
        scores=scores,
        idea_dict=idea_dict,
        idea_profile=profile,
        llm_analysis={},
        gaps=[],
        evidence_list=[],
        similarity_results=[],
        verification={}
    )

    biz_cause = next(c for c in causes if c.parameter == "business_potential")
    assert biz_cause.severity in ["HIGH", "CRITICAL"]
    assert any("Pricing" in rc.cause for rc in biz_cause.root_causes)


def test_2_missing_pricing_recommendation():
    engine = RecommendationEngineService()
    idea_dict = {"title": "SaaS Platform", "description": "B2B SaaS tool", "pricing": None}
    extractor = IdeaProfileExtractor()
    profile = extractor.extract_profile(idea_dict)
    scores = {"business_potential": 42.0, "market_demand": 70.0}

    output = engine.generate_pipeline_recommendations(
        idea_dict=idea_dict,
        param_scores=scores,
        gaps=[],
        idea_profile=profile
    )

    pricing_rec = next((r for r in output.recommendations if r.parameter == "business_potential"), None)
    assert pricing_rec is not None
    assert "pricing" in pricing_rec.action.lower()
    assert pricing_rec.missing_information == "Customer willingness-to-pay and unit economics data"


def test_3_vague_customer_recommendation():
    engine = RecommendationEngineService()
    idea_dict = {"title": "App for all", "target_customer": "Everyone in the world"}
    extractor = IdeaProfileExtractor()
    profile = extractor.extract_profile(idea_dict)
    scores = {"target_customer_clarity": 35.0}

    output = engine.generate_pipeline_recommendations(
        idea_dict=idea_dict,
        param_scores=scores,
        gaps=[],
        idea_profile=profile
    )

    cust_rec = next((r for r in output.recommendations if r.parameter == "target_customer_clarity"), None)
    assert cust_rec is not None
    assert "niche customer profile" in cust_rec.action.lower() or "segment" in cust_rec.action.lower()


def test_4_weak_technical_feasibility_recommendation():
    engine = RecommendationEngineService()
    idea_dict = {"title": "AI Neural Link", "technology": ""}
    extractor = IdeaProfileExtractor()
    profile = extractor.extract_profile(idea_dict)
    scores = {"technical_feasibility": 40.0}

    output = engine.generate_pipeline_recommendations(
        idea_dict=idea_dict,
        param_scores=scores,
        gaps=[],
        idea_profile=profile
    )

    tech_rec = next((r for r in output.recommendations if r.parameter == "technical_feasibility"), None)
    assert tech_rec is not None
    assert "technology stack" in tech_rec.action.lower() or "prototype" in tech_rec.action.lower()


def test_5_weak_differentiation_recommendation():
    engine = RecommendationEngineService()
    idea_dict = {"title": "Generic Rideshare"}
    extractor = IdeaProfileExtractor()
    profile = extractor.extract_profile(idea_dict)
    scores = {"uniqueness": 45.0}

    output = engine.generate_pipeline_recommendations(
        idea_dict=idea_dict,
        param_scores=scores,
        gaps=[],
        idea_profile=profile
    )

    uniq_rec = next((r for r in output.recommendations if r.parameter == "uniqueness"), None)
    assert uniq_rec is not None
    assert "value proposition" in uniq_rec.action.lower() or "competitors" in uniq_rec.action.lower()


def test_6_high_quality_idea_fewer_critical_recommendations():
    engine = RecommendationEngineService()
    idea_dict = {"title": "Strong Startup Idea"}
    extractor = IdeaProfileExtractor()
    profile = extractor.extract_profile(idea_dict)
    # High scores for all parameters
    scores = {
        "market_demand": 85.0,
        "problem_solution_fit": 90.0,
        "target_customer_clarity": 88.0,
        "competition": 82.0,
        "uniqueness": 85.0,
        "technical_feasibility": 92.0,
        "business_potential": 86.0,
        "scalability": 84.0,
        "risk": 80.0
    }

    output = engine.generate_pipeline_recommendations(
        idea_dict=idea_dict,
        param_scores=scores,
        gaps=[],
        idea_profile=profile
    )

    critical_recs = [r for r in output.recommendations if r.priority == "CRITICAL"]
    assert len(critical_recs) == 0


def test_7_recommendation_prioritization():
    p_service = ActionPrioritizationService()
    recs = [
        StructuredRecommendation(
            id="rec_1", parameter="scalability", current_score=60.0, severity="MEDIUM",
            root_cause="Manual tasks", missing_information="Scaling costs", objective="Automate",
            action="Automate onboarding", priority="MEDIUM", effort="HIGH", why_it_matters="Margin limit",
            validation_method="Test", expected_impact="May improve", affected_parameters=["scalability"]
        ),
        StructuredRecommendation(
            id="rec_2", parameter="target_customer_clarity", current_score=35.0, severity="CRITICAL",
            root_cause="Vague target customer", missing_information="Persona", objective="Define segment",
            action="Define 1 target segment", priority="CRITICAL", effort="LOW", why_it_matters="Dilutes focus",
            validation_method="Document", expected_impact="Is expected to improve",
            affected_parameters=["target_customer_clarity", "market_demand", "business_potential"]
        )
    ]

    prioritized = p_service.prioritize_actions(recs)
    assert prioritized[0].id == "rec_2"
    assert prioritized[0].priority == "CRITICAL"


def test_8_recommendation_confidence():
    rec = StructuredRecommendation(
        id="rec_001", parameter="business_potential", current_score=42.0, severity="HIGH",
        root_cause="Missing pricing", missing_information="Willingness to pay", objective="Validate price",
        action="Interview 5 buyers", priority="HIGH", effort="MEDIUM", why_it_matters="Revenue unclear",
        validation_method="Surveys", expected_impact="May improve", affected_parameters=["business_potential"],
        confidence=0.86
    )

    assert 0.0 <= rec.confidence <= 1.0
    assert rec.confidence == 0.86


def test_9_invalid_llm_json_handling():
    class DummyLLM:
        model_name = "dummy"
        model_version = "v1"
        def _call_llm(self, prompt):
            return "Invalid non-JSON string response"

    engine = RecommendationEngineService()
    engine.llm_service = DummyLLM()

    result = engine._try_llm_recommendation_enhancement(
        idea_dict={"title": "Test"},
        param_scores={"business_potential": 40.0},
        gaps=[],
        root_causes=[]
    )

    assert result is None  # Triggered safe fallback


def test_10_deterministic_fallback():
    engine = RecommendationEngineService()
    idea_dict = {"title": "Test Idea", "pricing": None}
    extractor = IdeaProfileExtractor()
    profile = extractor.extract_profile(idea_dict)

    output = engine.generate_pipeline_recommendations(
        idea_dict=idea_dict,
        param_scores={"business_potential": 42.0},
        gaps=[],
        idea_profile=profile
    )

    assert len(output.recommendations) > 0
    assert output.recommendations[0].parameter == "business_potential"


def test_11_v1_to_v2_comparison_and_score_delta():
    from app.services.validation_service import ValidationService

    class DummyScore:
        def __init__(self, param, val):
            self.parameter = param
            self.score = val

    class DummyValidation:
        def __init__(self, idea_id, version, overall_score, scores_dict):
            self.idea_id = idea_id
            self.version = version
            self.overall_score = overall_score
            self.scores = [DummyScore(k, v) for k, v in scores_dict.items()]
            self.recommendations = []

    v1 = DummyValidation(1, 1, 45.0, {"business_potential": 42.0, "market_demand": 50.0})
    v2 = DummyValidation(1, 2, 64.0, {"business_potential": 61.0, "market_demand": 67.0})

    service = ValidationService(None)
    comparison = service.compare_validations(v1, v2)

    assert comparison["overall_delta"] == 19.0
    biz_comp = next(p for p in comparison["parameter_comparisons"] if p["parameter"] == "business_potential")
    assert biz_comp["v1_score"] == 42.0
    assert biz_comp["v2_score"] == 61.0
    assert biz_comp["delta"] == 19.0


def test_12_no_fake_score_modification():
    scoring_service = ScoringService()
    analysis = {
        "market_demand": {"score": 70.0, "reason": ""},
        "problem_solution_fit": {"score": 75.0, "reason": ""},
        "target_customer_clarity": {"score": 80.0, "reason": ""},
        "competition": {"score": 65.0, "reason": ""},
        "uniqueness": {"score": 60.0, "reason": ""},
        "technical_feasibility": {"score": 85.0, "reason": ""},
        "business_potential": {"score": 50.0, "reason": ""},
        "scalability": {"score": 70.0, "reason": ""},
        "risk": {"score": 60.0, "reason": ""}
    }

    score1, _, params1 = scoring_service.calculate_scores(analysis)

    # Creating recommendations does not alter score calculation
    engine = RecommendationEngineService()
    output = engine.generate_pipeline_recommendations(
        idea_dict={"title": "Test"},
        param_scores=params1,
        gaps=[]
    )

    score2, _, params2 = scoring_service.calculate_scores(analysis)
    assert score1 == score2
    assert params1 == params2


def test_13_recommendation_specificity():
    engine = RecommendationEngineService()
    idea_dict = {"title": "Niche B2B App", "pricing": None, "target_customer": "everyone"}
    extractor = IdeaProfileExtractor()
    profile = extractor.extract_profile(idea_dict)

    output = engine.generate_pipeline_recommendations(
        idea_dict=idea_dict,
        param_scores={"business_potential": 40.0, "target_customer_clarity": 35.0},
        gaps=[],
        idea_profile=profile
    )

    actions = [r.action for r in output.recommendations]
    assert not any(a == "Do market research" for a in actions)
    assert any("pricing" in a.lower() for a in actions)
    assert any("customer" in a.lower() or "segment" in a.lower() for a in actions)


def test_14_recommendation_diversity():
    engine = RecommendationEngineService()
    idea_dict = {"title": "Tech Platform"}
    extractor = IdeaProfileExtractor()
    profile = extractor.extract_profile(idea_dict)

    output = engine.generate_pipeline_recommendations(
        idea_dict=idea_dict,
        param_scores={
            "business_potential": 40.0,
            "technical_feasibility": 45.0,
            "uniqueness": 50.0
        },
        gaps=[],
        idea_profile=profile
    )

    params_targeted = {r.parameter for r in output.recommendations}
    assert len(params_targeted) >= 3
    assert "business_potential" in params_targeted
    assert "technical_feasibility" in params_targeted
    assert "uniqueness" in params_targeted
