from typing import Dict, Any, List


class ConfidenceService:
    def calculate_confidence(
        self,
        idea_data: Dict[str, Any],
        llm_output: Dict[str, Any],
        evidence_list: List[Dict[str, Any]],
        rule_results: List[Dict[str, Any]],
        idea_profile: Any = None
    ) -> float:
        """
        Confidence formula:
        Confidence = (Input Completeness * 0.35)
                   + (Model Agreement / Param Confidence * 0.35)
                   + (Evidence Quality * 0.15)
                   + (Rule Consistency * 0.15)
        """
        if idea_profile is None:
            from app.services.idea_profile_service import IdeaProfileExtractor
            extractor = IdeaProfileExtractor()
            idea_profile = extractor.extract_profile(idea_data)

        # 1. Input Completeness derived from IdeaProfile
        input_completeness = float(getattr(idea_profile, "completeness_score", 30.0))

        # 2. Model Agreement (Average confidence returned by LLM parameter scores)
        conf_scores = []
        for param in ["market_demand", "problem_solution_fit", "target_customer_clarity", "competition", "uniqueness", "technical_feasibility", "business_potential", "scalability", "risk"]:
            p_conf = llm_output.get(param, {}).get("confidence", 50.0)
            conf_scores.append(float(p_conf))
        model_agreement = sum(conf_scores) / len(conf_scores) if conf_scores else 50.0

        # 3. Evidence Quality
        if getattr(idea_profile, "is_vague", False):
            evidence_quality = 20.0
        elif not evidence_list:
            evidence_quality = 40.0
        else:
            high_rel = sum(1 for e in evidence_list if e.get("reliability") == "HIGH")
            evidence_quality = min(100.0, 50.0 + (high_rel * 25.0))

        # 4. Rule Consistency
        passed_rules = sum(1 for r in rule_results if r.get("passed"))
        total_rules = len(rule_results) or 1
        rule_consistency = (passed_rules / total_rules) * 100.0

        confidence = (
            (input_completeness * 0.35) +
            (model_agreement * 0.35) +
            (evidence_quality * 0.15) +
            (rule_consistency * 0.15)
        )

        return round(max(5.0, min(100.0, confidence)), 2)
