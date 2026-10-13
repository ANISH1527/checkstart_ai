from typing import Dict, Any, List, Optional
from app.core.config import settings


class ConfidenceResult(float):
    """
    Float-subclass that encapsulates confidence_score while supporting
    dictionary lookups and attribute access for confidence_breakdown.
    """
    def __new__(cls, score: float, breakdown: dict):
        obj = super().__new__(cls, score)
        obj.confidence_score = score
        obj.confidence_breakdown = breakdown
        return obj

    def __getitem__(self, key):
        if key == "confidence_score":
            return float(self)
        if key == "confidence_breakdown":
            return self.confidence_breakdown
        raise KeyError(key)

    def get(self, key, default=None):
        if key == "confidence_score":
            return float(self)
        if key == "confidence_breakdown":
            return self.confidence_breakdown
        return default

    def to_dict(self) -> dict:
        return {
            "confidence_score": float(self),
            "confidence_breakdown": self.confidence_breakdown
        }


class ConfidenceService:
    def calculate_confidence(
        self,
        idea_data: Dict[str, Any],
        llm_output: Dict[str, Any],
        evidence_list: Optional[List[Dict[str, Any]]] = None,
        rule_results: Optional[List[Dict[str, Any]]] = None,
        idea_profile: Any = None,
        overrides_applied: Optional[List[Dict[str, Any]]] = None
    ) -> ConfidenceResult:
        """
        Calculates calibrated confidence score and breakdown.
        Applies penalties for overrides, evidence reliability, mock provider, and short input.
        """
        evidence_list = evidence_list or []
        rule_results = rule_results or []
        overrides_applied = overrides_applied or []

        if idea_profile is None:
            from app.services.idea_profile_service import IdeaProfileExtractor
            extractor = IdeaProfileExtractor()
            idea_profile = extractor.extract_profile(idea_data)

        # 1. Input Completeness
        input_completeness = float(getattr(idea_profile, "completeness_score", 30.0))

        # 2. Model Agreement
        conf_scores = []
        for param in ["market_demand", "problem_solution_fit", "target_customer_clarity", "competition", "uniqueness", "technical_feasibility", "business_potential", "scalability", "risk"]:
            p_val = llm_output.get(param)
            if isinstance(p_val, dict):
                conf_scores.append(float(p_val.get("confidence", 50.0)))
            else:
                conf_scores.append(50.0)
        model_agreement = sum(conf_scores) / len(conf_scores) if conf_scores else 50.0

        # 3. Evidence Quality
        if getattr(idea_profile, "is_vague", False):
            evidence_quality = 20.0
        elif not evidence_list:
            evidence_quality = 40.0
        else:
            high_rel = sum(1 for e in evidence_list if (e.get("reliability") if isinstance(e, dict) else getattr(e, "reliability", None)) in ["HIGH", "VERIFIED"])
            evidence_quality = min(100.0, 50.0 + (high_rel * 25.0))

        # 4. Rule Consistency
        passed_rules = sum(1 for r in rule_results if (r.get("passed", True) if isinstance(r, dict) else getattr(r, "passed", True)))
        total_rules = max(1, len(rule_results))
        rule_consistency = (passed_rules / total_rules) * 100.0

        base_confidence = (
            (input_completeness * 0.35) +
            (model_agreement * 0.35) +
            (evidence_quality * 0.15) +
            (rule_consistency * 0.15)
        )

        # DEDUCTION 1 — Overrides applied (-5 per override)
        override_penalty = len(overrides_applied) * 5.0

        # DEDUCTION 2 — Evidence reliability
        if len(evidence_list) == 0:
            evidence_penalty = 15.0
            generated_penalty = 0.0
        elif all((e.get("reliability") if isinstance(e, dict) else getattr(e, "reliability", None)) == "GENERATED" for e in evidence_list):
            evidence_penalty = 12.0
            generated_penalty = 12.0
        elif any((e.get("reliability") if isinstance(e, dict) else getattr(e, "reliability", None)) == "VERIFIED" for e in evidence_list):
            evidence_penalty = 0.0
            generated_penalty = 0.0
        else:
            evidence_penalty = 5.0
            generated_penalty = 0.0

        # DEDUCTION 3 — Mock provider penalty
        provider_penalty = 20.0 if getattr(settings, "LLM_PROVIDER", "mock") == "mock" else 0.0

        # DEDUCTION 4 — Very short input
        full_text = " ".join(filter(None, [
            idea_data.get("title"),
            idea_data.get("description"),
            idea_data.get("problem"),
            idea_data.get("solution"),
            idea_data.get("target_customer")
        ]))
        text_len = len(full_text)
        if text_len < 150:
            length_penalty = 15.0
        elif text_len < 300:
            length_penalty = 8.0
        else:
            length_penalty = 0.0

        final_confidence = (
            base_confidence
            - override_penalty
            - evidence_penalty
            - provider_penalty
            - length_penalty
        )

        # Hard ceiling for mock mode
        if getattr(settings, "LLM_PROVIDER", "mock") == "mock":
            final_confidence = min(final_confidence, 40.0)

        # Clamp between 10.0 and 95.0
        final_confidence = max(10.0, min(95.0, round(final_confidence, 1)))

        breakdown = {
            "base": round(base_confidence, 1),
            "completeness_bonus": round(input_completeness * 0.35, 1),
            "evidence_bonus": round(evidence_quality * 0.15, 1),
            "override_penalty": override_penalty,
            "evidence_penalty": evidence_penalty,
            "generated_evidence_penalty": generated_penalty,
            "provider_penalty": provider_penalty,
            "input_length_penalty": length_penalty,
            "length_penalty": length_penalty,
            "final": final_confidence
        }

        return ConfidenceResult(final_confidence, breakdown)
