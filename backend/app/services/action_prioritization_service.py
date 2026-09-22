from typing import List, Dict, Any
from app.schemas.recommendation import StructuredRecommendation, TopActionSummary


class ActionPrioritizationService:
    """
    Layer 14: Action Prioritization Service.
    Intelligently ranks recommendations based on weakness severity, score magnitude, multi-parameter impact,
    effort, and confidence. Avoids producing 10 equally important recommendations by outputting
    top 1-3 critical actions and categorizing priorities.
    """

    def prioritize_actions(
        self,
        recommendations: List[StructuredRecommendation]
    ) -> List[StructuredRecommendation]:
        if not recommendations:
            return []

        def calculate_priority_score(rec: StructuredRecommendation) -> float:
            # 1. Base score from severity
            severity_weights = {
                "CRITICAL": 100.0,
                "HIGH": 75.0,
                "MEDIUM": 50.0,
                "LOW": 25.0
            }
            base = severity_weights.get(rec.severity, 50.0)

            # 2. Score weight (lower current score = higher priority)
            score_deficit = max(0.0, 100.0 - rec.current_score) * 0.5

            # 3. Multi-parameter impact bonus (+15 for each additional parameter affected)
            affected_count = len(rec.affected_parameters)
            impact_bonus = (affected_count - 1) * 15.0 if affected_count > 1 else 0.0

            # 4. Effort modifier (LOW effort gives quick-win bonus)
            effort_modifiers = {
                "LOW": 10.0,
                "MEDIUM": 5.0,
                "HIGH": 0.0
            }
            effort_bonus = effort_modifiers.get(rec.effort.upper(), 5.0)

            # Total score
            return base + score_deficit + impact_bonus + effort_bonus

        # Sort recommendations descending by computed priority score
        sorted_recs = sorted(recommendations, key=calculate_priority_score, reverse=True)

        # Re-assign priority labels based on top ranking
        for idx, rec in enumerate(sorted_recs):
            if idx == 0 and rec.current_score < 50.0:
                rec.priority = "CRITICAL"
            elif idx < 2:
                rec.priority = "HIGH"
            elif idx < 5:
                rec.priority = "MEDIUM"
            else:
                rec.priority = "LOW"

        return sorted_recs

    def extract_top_3_summary(
        self,
        prioritized_recs: List[StructuredRecommendation]
    ) -> List[TopActionSummary]:
        top_3: List[TopActionSummary] = []
        for idx, rec in enumerate(prioritized_recs[:3], start=1):
            top_3.append(TopActionSummary(
                rank=idx,
                title=f"Improve {rec.parameter.replace('_', ' ').title()}",
                action=rec.action,
                parameter=rec.parameter,
                priority=rec.priority,
                reason=f"Addresses {rec.root_cause.lower()} affecting {len(rec.affected_parameters)} parameter(s)."
            ))
        return top_3
