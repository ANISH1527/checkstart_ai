from typing import Dict, Any, List
from app.services.recommendation_engine_service import RecommendationEngineService


class RecommendationService:
    """
    Wrapper around RecommendationEngineService for backward compatibility.
    """

    def __init__(self):
        self.engine = RecommendationEngineService()

    def generate_recommendations(
        self,
        idea_data: Dict[str, Any],
        scores: Dict[str, float],
        gaps: List[Dict[str, Any]],
        idea_profile: Any = None,
        llm_analysis: Any = None,
        evidence_list: Any = None,
        similarity_results: Any = None,
        verification: Any = None
    ) -> List[Dict[str, Any]]:
        output = self.engine.generate_pipeline_recommendations(
            idea_dict=idea_data,
            param_scores=scores,
            gaps=gaps,
            idea_profile=idea_profile,
            llm_analysis=llm_analysis,
            evidence_list=evidence_list,
            similarity_results=similarity_results,
            verification=verification
        )
        return [rec.dict() for rec in output.recommendations]
