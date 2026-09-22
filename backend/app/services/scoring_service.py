from typing import Dict, Any, Tuple, Optional
from app.core.logging import struct_logger as logger


class ScoringService:
    # Explicit required parameter weights totaling 100% (1.00)
    WEIGHTS = {
        "market_demand": 0.25,
        "problem_solution_fit": 0.20,
        "target_customer_clarity": 0.10,
        "competition": 0.10,
        "uniqueness": 0.10,
        "technical_feasibility": 0.10,
        "business_potential": 0.10,
        "scalability": 0.03,
        "risk": 0.02
    }

    assert abs(sum(WEIGHTS.values()) - 1.0) < 1e-9, (
        f"Scoring weights must sum to 1.0, currently sum to {sum(WEIGHTS.values()):.6f}"
    )

    def calculate_scores(self, llm_output: Dict[str, Any], idea_id: Optional[int] = None) -> Tuple[float, str, Dict[str, float]]:
        """
        Calculates final weighted score from individual parameter scores.
        Weights:
        Market Demand: 25%
        Problem-Solution Fit: 20%
        Target Customer Clarity: 10%
        Competition Environment: 10%
        Uniqueness: 10%
        Technical Feasibility: 10%
        Business Potential: 10%
        Scalability: 3%
        Risk Level: 2%
        """
        extracted_scores = {}
        weighted_sum = 0.0

        for param_name, weight in self.WEIGHTS.items():
            param_data = llm_output.get(param_name, {})
            raw_score = float(param_data.get("score", 50.0))

            if not (0 <= raw_score <= 100):
                logger.warning(
                    "score_clipped",
                    param=param_name,
                    raw=raw_score,
                    clipped=max(0.0, min(100.0, raw_score)),
                    idea_id=idea_id
                )
                raw_score = max(0.0, min(100.0, raw_score))

            extracted_scores[param_name] = raw_score
            weighted_sum += raw_score * weight

        overall_score = round(weighted_sum, 2)
        classification = self.classify_score(overall_score)

        return overall_score, classification, extracted_scores

    @staticmethod
    def classify_score(score: float) -> str:
        if score >= 90.0:
            return "EXCEPTIONAL"
        elif score >= 75.0:
            return "STRONG"
        elif score >= 60.0:
            return "MODERATE"
        elif score >= 40.0:
            return "WEAK"
        else:
            return "VERY_WEAK"

