import json
from typing import Dict, Any, List, Optional
from app.schemas.recommendation import (
    RecommendationEngineOutput,
    StructuredRecommendation,
    ParameterRootCause,
    TopActionSummary,
    ImprovementImpactPrediction
)
from app.services.root_cause_service import RootCauseService
from app.services.improvement_strategy_service import ImprovementStrategyService
from app.services.action_prioritization_service import ActionPrioritizationService
from app.services.improvement_impact_service import ImprovementImpactService
from app.services.llm_service import get_llm_service


class RecommendationEngineService:
    """
    Unified Orchestrator for Layers 12-15 of the Advanced Improvement Pipeline:
      - Layer 12: Root Cause Analysis
      - Layer 13: Improvement Strategy Generation
      - Layer 14: Action Prioritization
      - Layer 15: Impact Prediction
    Handles LLM integration with strict Pydantic JSON validation and deterministic fallback.
    """

    def __init__(self):
        self.root_cause_service = RootCauseService()
        self.strategy_service = ImprovementStrategyService()
        self.prioritization_service = ActionPrioritizationService()
        self.impact_service = ImprovementImpactService()
        self.llm_service = get_llm_service()

    def generate_pipeline_recommendations(
        self,
        idea_dict: Dict[str, Any],
        param_scores: Dict[str, float],
        gaps: List[Dict[str, Any]],
        idea_profile: Any = None,
        llm_analysis: Optional[Dict[str, Any]] = None,
        evidence_list: Optional[List[Dict[str, Any]]] = None,
        similarity_results: Optional[List[Dict[str, Any]]] = None,
        verification: Optional[Dict[str, Any]] = None
    ) -> RecommendationEngineOutput:
        llm_analysis = llm_analysis or {}
        evidence_list = evidence_list or []
        similarity_results = similarity_results or []
        verification = verification or {}

        if idea_profile is None:
            from app.services.idea_profile_service import IdeaProfileExtractor
            extractor = IdeaProfileExtractor()
            idea_profile = extractor.extract_profile(idea_dict)

        # 1. Execute Layer 12: Root Cause Analysis
        root_causes = self.root_cause_service.analyze_root_causes(
            scores=param_scores,
            idea_dict=idea_dict,
            idea_profile=idea_profile,
            llm_analysis=llm_analysis,
            gaps=gaps,
            evidence_list=evidence_list,
            similarity_results=similarity_results,
            verification=verification
        )

        # 2. Execute Layer 13: Improvement Strategy Generation (Deterministic Core)
        strategies = self.strategy_service.generate_strategies(
            root_causes=root_causes,
            gaps=gaps,
            idea_dict=idea_dict,
            idea_profile=idea_profile
        )

        # 3. Try LLM Enhancement if configured and healthy, with strict fallback
        llm_recs = self._try_llm_recommendation_enhancement(
            idea_dict=idea_dict,
            param_scores=param_scores,
            gaps=gaps,
            root_causes=root_causes
        )
        if llm_recs:
            strategies = llm_recs

        # 4. Execute Layer 14: Action Prioritization
        prioritized_recs = self.prioritization_service.prioritize_actions(strategies)
        top_3_summary = self.prioritization_service.extract_top_3_summary(prioritized_recs)

        # 5. Execute Layer 15: Impact Prediction
        impact_predictions = self.impact_service.predict_impacts(prioritized_recs)

        return RecommendationEngineOutput(
            root_causes=root_causes,
            recommendations=prioritized_recs,
            top_3_actions=top_3_summary,
            impact_predictions=impact_predictions
        )

    def _try_llm_recommendation_enhancement(
        self,
        idea_dict: Dict[str, Any],
        param_scores: Dict[str, float],
        gaps: List[Dict[str, Any]],
        root_causes: List[ParameterRootCause]
    ) -> Optional[List[StructuredRecommendation]]:
        """
        Attempts to query the LLM with structured context and JSON schema constraints.
        If any parsing error occurs, returns None to trigger deterministic fallback.
        """
        if getattr(self.llm_service, "use_mock", True):
            return None

        try:
            prompt = f"""
Analyze the following startup idea weaknesses and produce structured recommendations in strict JSON.

Startup Idea: {json.dumps(idea_dict)}
Parameter Scores: {json.dumps(param_scores)}
Information Gaps: {json.dumps(gaps)}
Root Causes: {json.dumps([rc.dict() for rc in root_causes])}

Return a JSON object with key "recommendations" containing an array of recommendation items.
Each item MUST contain:
id, parameter, current_score, severity, root_cause, missing_information, objective, action, priority, effort, why_it_matters, validation_method, expected_impact, affected_parameters, confidence, status
"""
            raw_response = self.llm_service._call_llm(prompt)
            if not raw_response:
                return None

            # Attempt JSON parse
            parsed = json.loads(raw_response)
            rec_list = parsed.get("recommendations", [])
            valid_recs = [StructuredRecommendation(**item) for item in rec_list]
            return valid_recs if valid_recs else None
        except Exception:
            # Safe deterministic fallback
            return None
