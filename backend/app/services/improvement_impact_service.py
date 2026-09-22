from typing import List
from app.schemas.recommendation import StructuredRecommendation, ImprovementImpactPrediction, AffectedParameterImpact


class ImprovementImpactService:
    """
    Layer 15: Improvement Impact Prediction Service.
    Predicts potential parameter-level impacts resulting from completing recommended actions.
    Explicitly frames all predictions as Expected/Potential Impact, avoiding guaranteed score increases.
    """

    def predict_impacts(
        self,
        recommendations: List[StructuredRecommendation]
    ) -> List[ImprovementImpactPrediction]:
        predictions: List[ImprovementImpactPrediction] = []

        for rec in recommendations:
            impacts: List[AffectedParameterImpact] = []

            # Primary parameter impact
            impacts.append(AffectedParameterImpact(
                parameter=rec.parameter,
                expected_direction="IMPROVE",
                reason=f"Directly resolves missing information for {rec.parameter.replace('_', ' ')}."
            ))

            # Secondary parameter impacts
            for affected in rec.affected_parameters:
                if affected != rec.parameter:
                    impacts.append(AffectedParameterImpact(
                        parameter=affected,
                        expected_direction="MAY_IMPROVE",
                        reason=f"Provides supporting evidence or clarity beneficial to {affected.replace('_', ' ')}."
                    ))

            predictions.append(ImprovementImpactPrediction(
                action=rec.action,
                potentially_affected_parameters=impacts
            ))

        return predictions
