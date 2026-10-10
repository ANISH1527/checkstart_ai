from typing import Dict, Any, Tuple, Optional
from app.core.logging import struct_logger as logger

FRAMEWORK_VERSION = "v1.0"


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

    @classmethod
    def get_framework_info(cls) -> Dict[str, Any]:
        return {
            "version": FRAMEWORK_VERSION,
            "weights": cls.WEIGHTS,
            "weight_sum": sum(cls.WEIGHTS.values()),
            "rounding_policy": "round(score, 1)",
            "bands": {
                "EXCEPTIONAL": {"min": 90.0, "label": "Highly Promising"},
                "STRONG": {"min": 75.0, "label": "Promising"},
                "MODERATE": {"min": 60.0, "label": "Moderate"},
                "WEAK": {"min": 40.0, "label": "Needs Improvement"},
                "VERY_WEAK": {"min": 0.0, "label": "High Risk"}
            }
        }

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

            extracted_scores[param_name] = round(raw_score, 1)
            weighted_sum += raw_score * weight

        overall_score = round(weighted_sum, 1)
        classification = self.classify_score(overall_score)

        return overall_score, classification, extracted_scores

    @staticmethod
    def classify_score(score: float) -> str:
        """Returns the canonical 5-band code."""
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

    @classmethod
    def classify(cls, score: float) -> Dict[str, str]:
        """Returns stable code, display label, and frontend category badge mapping."""
        code = cls.classify_score(score)
        label_map = {
            "EXCEPTIONAL": ("Highly Promising", "Highly Promising"),
            "STRONG": ("Promising", "Promising"),
            "MODERATE": ("Moderate", "Promising"),
            "WEAK": ("Needs Improvement", "Needs Improvement"),
            "VERY_WEAK": ("High Risk", "High Risk")
        }
        label, fe_cat = label_map[code]
        return {
            "code": code,
            "label": label,
            "category": fe_cat
        }

    @staticmethod
    def aggregate_to_7_parameters(extracted_scores: Dict[str, float]) -> Dict[str, float]:
        """
        Rolls up the 9-dimensional backend scores into the 7-parameter format
        expected by the frontend UI cards, radar, and matrix (scale 1.0 - 10.0).
        """
        md = extracted_scores.get("market_demand", 50.0) / 10.0
        psf = extracted_scores.get("problem_solution_fit", 50.0) / 10.0
        comp = extracted_scores.get("competition", 50.0) / 10.0
        tcc = extracted_scores.get("target_customer_clarity", 50.0) / 10.0
        uniq = extracted_scores.get("uniqueness", 50.0) / 10.0
        feas = extracted_scores.get("technical_feasibility", 50.0) / 10.0
        biz = extracted_scores.get("business_potential", 50.0) / 10.0

        return {
            "marketDemand": round(md, 1),
            "problemSeverity": round(psf, 1),
            "competition": round(comp, 1),
            "targetCustomer": round(tcc, 1),
            "innovation": round(uniq, 1),
            "feasibility": round(feas, 1),
            "revenuePotential": round(biz, 1)
        }
