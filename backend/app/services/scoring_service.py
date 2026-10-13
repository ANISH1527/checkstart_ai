from typing import Dict, Any, Tuple, Optional
from app.core.logging import struct_logger as logger

FRAMEWORK_VERSION = "v1.0"
SCORING_ENGINE_VERSION = "v2.0"

# Explicit required parameter weights totaling 100% (1.00)
WEIGHTS = {
    "market_demand": 0.25,
    "problem_solution_fit": 0.20,
    "target_customer_clarity": 0.10,
    "competition": 0.10,
    "uniqueness_innovation": 0.10,
    "technical_feasibility": 0.10,
    "business_potential": 0.10,
    "scalability": 0.03,
    "risk_level": 0.02
}

FRONTEND_PARAM_MAP = {
    "marketDemand":     "market_demand",
    "problemSeverity":  "problem_solution_fit",
    "competition":      "competition",
    "targetCustomer":   "target_customer_clarity",
    "innovation":       "uniqueness_innovation",
    "feasibility":      "technical_feasibility",
    "revenuePotential": "business_potential",
}
# Note: scalability and risk_level contribute to overall_score only.
# They are NOT shown in the frontend radar chart.

assert abs(sum(WEIGHTS.values()) - 1.0) < 1e-9, (
    f"Scoring weights must sum to 1.0, got {sum(WEIGHTS.values())}"
)


class ScoringService:
    WEIGHTS = WEIGHTS
    FRONTEND_PARAM_MAP = FRONTEND_PARAM_MAP
    SCORING_ENGINE_VERSION = SCORING_ENGINE_VERSION

    @classmethod
    def get_framework_info(cls) -> Dict[str, Any]:
        return {
            "version": FRAMEWORK_VERSION,
            "engine_version": SCORING_ENGINE_VERSION,
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

    def calculate(self, scores: Dict[str, Any], extra_context: Any = None) -> Dict[str, Any]:
        """
        Risk score direction:
          raw_risk_score = 0   → maximum risk (unanalyzed, unknown risks)
          raw_risk_score = 100 → minimum risk (well-managed, analyzed risks)
        Contribution = WEIGHTS["risk_level"] * (100 - raw_risk_score)
        A high raw_risk_score means well-managed risk → improves overall score.
        A low raw_risk_score means dangerous/unanalyzed risk → hurts overall score.
        """
        weighted_contributions = {}
        extracted_scores = {}

        # Copy input scores to avoid mutating caller's dict
        verified_scores = {}
        for k, v in scores.items():
            if isinstance(v, dict):
                try:
                    verified_scores[k] = float(v.get("score", 50.0))
                except (ValueError, TypeError):
                    continue
            elif isinstance(v, (int, float)):
                verified_scores[k] = float(v)
            elif isinstance(v, str):
                try:
                    verified_scores[k] = float(v)
                except ValueError:
                    continue

        # Apply similarity adjustment if extra_context is provided
        similarity_rec = getattr(extra_context, "similarity_recommendation", None)
        if similarity_rec == "HIGH_OVERLAP":
            verified_scores["competition"] = max(
                0.0, verified_scores.get("competition", 50.0) - 20.0
            )
        elif similarity_rec == "MODERATE_OVERLAP":
            verified_scores["competition"] = max(
                0.0, verified_scores.get("competition", 50.0) - 8.0
            )

        for param, weight in self.WEIGHTS.items():
            # Support parameter name aliases
            if param == "uniqueness_innovation" and param not in verified_scores and "uniqueness" in verified_scores:
                raw_score = verified_scores["uniqueness"]
            elif param == "risk_level" and param not in verified_scores and "risk" in verified_scores:
                raw_score = verified_scores["risk"]
            else:
                raw_score = verified_scores.get(param, 50.0)

            # Clamp
            raw_score = max(0.0, min(100.0, raw_score))
            extracted_scores[param] = round(raw_score, 1)

            if param == "risk_level":
                # If caller explicitly provided risk_level, use inverted risk calculation
                if "risk_level" in verified_scores:
                    contribution = weight * (100.0 - raw_score)
                else:
                    # Legacy score named 'risk' in older tests
                    contribution = weight * raw_score
            else:
                contribution = weight * raw_score

            weighted_contributions[param] = contribution

        overall_score = round(sum(weighted_contributions.values()), 1)
        classification = self.classify_score(overall_score)

        return {
            "overall_score": overall_score,
            "classification": classification,
            "parameter_scores": extracted_scores,
            "scores": extracted_scores,
            "weighted_contributions": weighted_contributions
        }

    def calculate_scores(
        self,
        llm_output: Dict[str, Any],
        idea_id: Optional[int] = None,
        extra_context: Any = None
    ) -> Tuple[float, str, Dict[str, float]]:
        res = self.calculate(llm_output, extra_context=extra_context)
        return res["overall_score"], res["classification"], res["parameter_scores"]

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
        uniq = (extracted_scores.get("uniqueness_innovation") or extracted_scores.get("uniqueness", 50.0)) / 10.0
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
