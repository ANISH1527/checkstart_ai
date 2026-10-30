import math
from typing import Dict, Any, Tuple, Optional
from app.core.logging import struct_logger as logger

# Framework & Version identifiers
DEFAULT_FRAMEWORK = "report_v1"
FRAMEWORK_VERSION = "v1.0"
SCORING_ENGINE_VERSION = "v2.0"

# ── report_v1: Authoritative 7-Parameter Viability Weights ──────────────────
# Scale: 1.0 - 10.0 per parameter
REPORT_V1_WEIGHTS: Dict[str, float] = {
    "market_demand": 0.25,
    "problem_severity": 0.20,
    "competition": 0.15,
    "target_customer": 0.10,
    "innovation": 0.10,
    "feasibility": 0.10,
    "revenue_potential": 0.10,
}
assert abs(sum(REPORT_V1_WEIGHTS.values()) - 1.0) < 1e-9, (
    f"report_v1 weights must sum to 1.0, got {sum(REPORT_V1_WEIGHTS.values())}"
)

# ── legacy_v9: Legacy 9-Dimension Weights ──────────────────────────────────
# Scale: 0.0 - 100.0 per parameter
LEGACY_V9_WEIGHTS: Dict[str, float] = {
    "market_demand": 0.25,
    "problem_solution_fit": 0.20,
    "target_customer_clarity": 0.10,
    "competition": 0.10,
    "uniqueness_innovation": 0.10,
    "technical_feasibility": 0.10,
    "business_potential": 0.10,
    "scalability": 0.03,
    "risk_level": 0.02,
}
assert abs(sum(LEGACY_V9_WEIGHTS.values()) - 1.0) < 1e-9, (
    f"legacy_v9 weights must sum to 1.0, got {sum(LEGACY_V9_WEIGHTS.values())}"
)

# Export WEIGHTS for legacy imports
WEIGHTS = LEGACY_V9_WEIGHTS

# Alias map from frontend/LLM variant names to canonical report_v1 parameter keys
REPORT_V1_ALIASES: Dict[str, str] = {
    "market_demand": "market_demand",
    "marketDemand": "market_demand",
    "problem_severity": "problem_severity",
    "problemSeverity": "problem_severity",
    "problem_solution_fit": "problem_severity",
    "problemSolutionFit": "problem_severity",
    "competition": "competition",
    "competitionAdvantage": "competition",
    "competition_advantage": "competition",
    "competitionMoat": "competition",
    "target_customer": "target_customer",
    "targetCustomer": "target_customer",
    "target_customer_clarity": "target_customer",
    "targetCustomerClarity": "target_customer",
    "innovation": "innovation",
    "uniqueness_innovation": "innovation",
    "uniqueness": "innovation",
    "feasibility": "feasibility",
    "technical_feasibility": "feasibility",
    "student_feasibility": "feasibility",
    "revenue_potential": "revenue_potential",
    "revenuePotential": "revenue_potential",
    "business_potential": "revenue_potential",
    "monetization": "revenue_potential",
}

# Alias map for legacy_v9 frontend keys
FRONTEND_PARAM_MAP = {
    "marketDemand": "market_demand",
    "problemSeverity": "problem_solution_fit",
    "competition": "competition",
    "targetCustomer": "target_customer_clarity",
    "innovation": "uniqueness_innovation",
    "feasibility": "technical_feasibility",
    "revenuePotential": "business_potential",
}


def clamp_score(x: Any) -> float:
    """
    Score clamping per academic spec:
    - NaN or None -> 5.0
    - Otherwise min(10.0, max(1.0, round(x, 1)))
    Guarantees score is bounded in [1.0, 10.0].
    """
    if x is None:
        return 5.0
    try:
        val = float(x)
        if math.isnan(val):
            return 5.0
        return float(min(10.0, max(1.0, round(val, 1))))
    except (ValueError, TypeError):
        return 5.0


def calculate_validation_score(scores: Dict[str, Any]) -> float:
    """
    Academic formula:
      S = sum(weight_i * score_i)
      V = S * 10 (percentage)
    Returns round(sum(weight_i * score_i) * 10, 2).
    """
    total_raw = 0.0
    for param, weight in REPORT_V1_WEIGHTS.items():
        raw_val = None
        for key, canonical in REPORT_V1_ALIASES.items():
            if canonical == param and key in scores:
                raw_val = scores[key]
                break
        if raw_val is None and param in scores:
            raw_val = scores[param]
        if isinstance(raw_val, dict):
            raw_val = raw_val.get("score")
        clamped = clamp_score(raw_val)
        total_raw += weight * clamped

    return round(total_raw * 10, 2)


def classify_report_v1(score_pct: float) -> Dict[str, str]:
    """
    Report v1 Classification Rubric:
    - 80.0–100.0: Highly Promising ("Build MVP and recruit beta users")
    - 60.0–79.9:  Promising ("Conduct 10-15 customer interviews")
    - 40.0–59.9:  Needs Improvement ("Execute a structured concept pivot")
    - 0.0–39.9:   High Risk ("Pause development and conduct exploratory research")
    (Min attainable score is 10.0%)
    """
    if score_pct >= 80.0:
        return {
            "code": "HIGHLY_PROMISING",
            "category": "Highly Promising",
            "label": "Highly Promising",
            "action": "Build MVP and recruit beta users",
        }
    elif score_pct >= 60.0:
        return {
            "code": "PROMISING",
            "category": "Promising",
            "label": "Promising",
            "action": "Conduct 10-15 customer interviews",
        }
    elif score_pct >= 40.0:
        return {
            "code": "NEEDS_IMPROVEMENT",
            "category": "Needs Improvement",
            "label": "Needs Improvement",
            "action": "Execute a structured concept pivot",
        }
    else:
        return {
            "code": "HIGH_RISK",
            "category": "High Risk",
            "label": "High Risk",
            "action": "Pause development and conduct exploratory research",
        }


def classify_legacy_v9(score: float) -> Dict[str, str]:
    """Legacy 5-band classification for backward compatibility."""
    if score >= 90.0:
        code = "EXCEPTIONAL"
        label = "Highly Promising"
    elif score >= 75.0:
        code = "STRONG"
        label = "Promising"
    elif score >= 60.0:
        code = "MODERATE"
        label = "Moderate"
    elif score >= 40.0:
        code = "WEAK"
        label = "Needs Improvement"
    else:
        code = "VERY_WEAK"
        label = "High Risk"

    return {
        "code": code,
        "label": label,
        "category": label
    }


class ScoringService:
    REPORT_V1_WEIGHTS = REPORT_V1_WEIGHTS
    LEGACY_V9_WEIGHTS = LEGACY_V9_WEIGHTS
    WEIGHTS = LEGACY_V9_WEIGHTS
    FRONTEND_PARAM_MAP = FRONTEND_PARAM_MAP
    SCORING_ENGINE_VERSION = SCORING_ENGINE_VERSION

    def __init__(self, framework: Optional[str] = None):
        self.framework = framework

    @classmethod
    def get_framework_info(cls, framework: str = DEFAULT_FRAMEWORK) -> Dict[str, Any]:
        if framework == "legacy_v9":
            return {
                "framework_name": "legacy_v9",
                "version": FRAMEWORK_VERSION,
                "engine_version": SCORING_ENGINE_VERSION,
                "weights": cls.LEGACY_V9_WEIGHTS,
                "weight_sum": sum(cls.LEGACY_V9_WEIGHTS.values()),
                "scale": "0-100",
                "bands": {
                    "EXCEPTIONAL": {"min": 90.0, "label": "Highly Promising"},
                    "STRONG": {"min": 75.0, "label": "Promising"},
                    "MODERATE": {"min": 60.0, "label": "Moderate"},
                    "WEAK": {"min": 40.0, "label": "Needs Improvement"},
                    "VERY_WEAK": {"min": 0.0, "label": "High Risk"}
                }
            }
        return {
            "framework_name": "report_v1",
            "version": FRAMEWORK_VERSION,
            "engine_version": SCORING_ENGINE_VERSION,
            "weights": cls.REPORT_V1_WEIGHTS,
            "weight_sum": sum(cls.REPORT_V1_WEIGHTS.values()),
            "scale": "1-10",
            "bands": {
                "HIGHLY_PROMISING": {"min": 80.0, "max": 100.0, "label": "Highly Promising", "action": "Build MVP and recruit beta users"},
                "PROMISING": {"min": 60.0, "max": 79.9, "label": "Promising", "action": "Conduct 10-15 customer interviews"},
                "NEEDS_IMPROVEMENT": {"min": 40.0, "max": 59.9, "label": "Needs Improvement", "action": "Execute a structured concept pivot"},
                "HIGH_RISK": {"min": 0.0, "max": 39.9, "label": "High Risk", "action": "Pause development and conduct exploratory research"},
            }
        }

    def _detect_framework(self, scores: Dict[str, Any]) -> str:
        """Detect framework if not explicitly set."""
        if self.framework:
            return self.framework
        # Check if legacy 9-dimension specific keys are present
        legacy_keys = {"scalability", "risk_level", "risk", "problem_solution_fit", "target_customer_clarity", "business_potential"}
        has_legacy_keys = any(k in scores for k in legacy_keys)
        # Check if scores are formatted on 0-100 scale (e.g. > 15)
        has_hundred_scale = any(
            isinstance(v, (int, float)) and v > 10.0 or
            (isinstance(v, dict) and isinstance(v.get("score"), (int, float)) and v.get("score") > 10.0)
            for v in scores.values()
        )
        if has_legacy_keys or has_hundred_scale:
            return "legacy_v9"
        return "report_v1"

    def calculate(
        self,
        scores: Dict[str, Any],
        extra_context: Any = None,
        framework: Optional[str] = None
    ) -> Dict[str, Any]:
        fw = framework or self._detect_framework(scores)
        if fw == "legacy_v9":
            return self._calculate_legacy_v9(scores, extra_context)
        return self._calculate_report_v1(scores, extra_context)

    def _calculate_report_v1(self, scores: Dict[str, Any], extra_context: Any = None) -> Dict[str, Any]:
        extracted_scores = {}
        weighted_contributions = {}
        raw_s = 0.0

        for param, weight in self.REPORT_V1_WEIGHTS.items():
            raw_val = None
            for key, canonical in REPORT_V1_ALIASES.items():
                if canonical == param and key in scores:
                    raw_val = scores[key]
                    break
            if raw_val is None and param in scores:
                raw_val = scores[param]
            if isinstance(raw_val, dict):
                raw_val = raw_val.get("score")

            clamped = clamp_score(raw_val)
            extracted_scores[param] = clamped
            contribution = weight * clamped
            weighted_contributions[param] = round(contribution, 4)
            raw_s += contribution

        similarity_rec = getattr(extra_context, "similarity_recommendation", None)
        if similarity_rec == "HIGH_OVERLAP":
            extracted_scores["competition"] = max(1.0, extracted_scores["competition"] - 2.0)
        elif similarity_rec == "MODERATE_OVERLAP":
            extracted_scores["competition"] = max(1.0, extracted_scores["competition"] - 0.8)

        raw_s = sum(self.REPORT_V1_WEIGHTS[p] * extracted_scores[p] for p in self.REPORT_V1_WEIGHTS)
        overall_score = round(raw_s, 2)
        score_ten = round(raw_s, 1)
        percentage = round(raw_s * 10, 2)

        classification_info = classify_report_v1(percentage)

        return {
            "framework_name": "report_v1",
            "framework_version": FRAMEWORK_VERSION,
            "overall_score": percentage,
            "overall_score_ten": score_ten,
            "raw_s": overall_score,
            "percentage": percentage,
            "classification": classification_info["category"],
            "classification_info": classification_info,
            "recommended_action": classification_info["action"],
            "parameter_scores": extracted_scores,
            "scores": extracted_scores,
            "weighted_contributions": weighted_contributions,
        }

    def _calculate_legacy_v9(self, scores: Dict[str, Any], extra_context: Any = None) -> Dict[str, Any]:
        weighted_contributions = {}
        extracted_scores = {}
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

        similarity_rec = getattr(extra_context, "similarity_recommendation", None)
        if similarity_rec == "HIGH_OVERLAP":
            verified_scores["competition"] = max(0.0, verified_scores.get("competition", 50.0) - 20.0)
        elif similarity_rec == "MODERATE_OVERLAP":
            verified_scores["competition"] = max(0.0, verified_scores.get("competition", 50.0) - 8.0)

        for param, weight in self.LEGACY_V9_WEIGHTS.items():
            if param == "uniqueness_innovation" and param not in verified_scores and "uniqueness" in verified_scores:
                raw_score = verified_scores["uniqueness"]
            elif param == "risk_level" and param not in verified_scores and "risk" in verified_scores:
                raw_score = verified_scores["risk"]
            else:
                raw_score = verified_scores.get(param, 50.0)

            # Clamp legacy 0-100
            raw_score = max(0.0, min(100.0, raw_score))
            extracted_scores[param] = round(raw_score, 1)

            if param == "risk_level":
                if "risk_level" in verified_scores:
                    contribution = weight * (100.0 - raw_score)
                else:
                    contribution = weight * raw_score
            else:
                contribution = weight * raw_score

            weighted_contributions[param] = contribution

        overall_score = round(sum(weighted_contributions.values()), 1)
        classification = self.classify_score(overall_score, framework="legacy_v9")

        return {
            "framework_name": "legacy_v9",
            "framework_version": FRAMEWORK_VERSION,
            "overall_score": overall_score,
            "percentage": overall_score,
            "classification": classification,
            "parameter_scores": extracted_scores,
            "scores": extracted_scores,
            "weighted_contributions": weighted_contributions,
        }

    def calculate_scores(
        self,
        llm_output: Dict[str, Any],
        idea_id: Optional[int] = None,
        extra_context: Any = None,
        framework: Optional[str] = None
    ) -> Tuple[float, str, Dict[str, float]]:
        res = self.calculate(llm_output, extra_context=extra_context, framework=framework)
        return res["overall_score"], res["classification"], res["parameter_scores"]

    @classmethod
    def classify_score(cls, score: float, framework: Optional[str] = None) -> str:
        fw = framework or DEFAULT_FRAMEWORK
        if fw == "legacy_v9":
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
        return classify_report_v1(score)["code"]

    @classmethod
    def classify(cls, score: float, framework: Optional[str] = None) -> Dict[str, str]:
        fw = framework or DEFAULT_FRAMEWORK
        if fw == "legacy_v9":
            return classify_legacy_v9(score)
        return classify_report_v1(score)

    @staticmethod
    def aggregate_to_7_parameters(extracted_scores: Dict[str, float]) -> Dict[str, float]:
        """Rolls up legacy 9-dimensional backend scores into 7-parameter format."""
        md = extracted_scores.get("market_demand", 50.0)
        psf = extracted_scores.get("problem_solution_fit", extracted_scores.get("problem_severity", 50.0))
        comp = extracted_scores.get("competition", 50.0)
        tcc = extracted_scores.get("target_customer_clarity", extracted_scores.get("target_customer", 50.0))
        uniq = extracted_scores.get("uniqueness_innovation") or extracted_scores.get("uniqueness") or extracted_scores.get("innovation", 50.0)
        feas = extracted_scores.get("technical_feasibility", extracted_scores.get("feasibility", 50.0))
        biz = extracted_scores.get("business_potential", extracted_scores.get("revenue_potential", 50.0))

        if md <= 10.0 and psf <= 10.0 and comp <= 10.0:
            return {
                "marketDemand": round(md, 1),
                "problemSeverity": round(psf, 1),
                "competition": round(comp, 1),
                "targetCustomer": round(tcc, 1),
                "innovation": round(uniq, 1),
                "feasibility": round(feas, 1),
                "revenuePotential": round(biz, 1),
            }

        return {
            "marketDemand": round(md / 10.0, 1),
            "problemSeverity": round(psf / 10.0, 1),
            "competition": round(comp / 10.0, 1),
            "targetCustomer": round(tcc / 10.0, 1),
            "innovation": round(uniq / 10.0, 1),
            "feasibility": round(feas / 10.0, 1),
            "revenuePotential": round(biz / 10.0, 1),
        }
