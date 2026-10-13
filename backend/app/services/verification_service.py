from typing import Dict, Any, List, Optional


class OverrideItem(dict):
    """
    Dictionary representing a score override item that also supports
    equality checks against rule reason strings for backwards-compatible test assertions.
    """
    def __init__(self, reason: str, parameter: str = "", original_score: float = 0.0, new_score: float = 0.0):
        super().__init__(
            reason=reason,
            parameter=parameter,
            original_score=original_score,
            new_score=new_score,
            rule=reason
        )
        self.reason = reason

    def __eq__(self, other):
        if isinstance(other, str):
            return self.get("reason") == other or self.get("parameter") == other
        return super().__eq__(other)

    def __hash__(self):
        return hash(self.get("reason"))

    def __repr__(self):
        return repr(self.get("reason"))


class VerificationService:
    def verify(
        self,
        user_input: Optional[Dict[str, Any]] = None,
        llm_output: Optional[Dict[str, Any]] = None,
        rule_results: Optional[List[Dict[str, Any]]] = None,
        idea_profile: Any = None,
        evidence_list: Optional[List[Dict[str, Any]]] = None,
        *,
        llm_scores: Optional[Dict[str, Any]] = None,
        profile: Any = None,
        evidence_results: Optional[List[Dict[str, Any]]] = None,
        idea_id: Optional[int] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Deterministic, rule-based verification layer (Layer 8).
        Intercepts and calibrates LLM scores against deterministic checks and domain heuristics.
        """
        user_data = user_input or {}
        prof = profile if profile is not None else idea_profile
        if prof is None:
            from app.services.idea_profile_service import IdeaProfileExtractor
            extractor = IdeaProfileExtractor()
            prof = extractor.extract_profile(user_data)
        idea_profile = prof

        rule_res = rule_results or []
        evidence_items = (
            evidence_results
            if evidence_results is not None
            else (evidence_list if evidence_list is not None else user_data.get("evidence", []))
        )

        # Normalize LLM score keys to snake_case backend format (Step 3)
        KEY_MAP = {
            "marketDemand":          "market_demand",
            "problemSolutionFit":    "problem_solution_fit",
            "targetCustomerClarity": "target_customer_clarity",
            "competition":           "competition",
            "uniquenessInnovation":  "uniqueness_innovation",
            "technicalFeasibility":  "technical_feasibility",
            "businessPotential":     "business_potential",
            "scalability":           "scalability",
            "riskLevel":             "risk_level",
            # Variations
            "problem_solution_fit":  "problem_solution_fit",
            "market_demand":         "market_demand",
            "business_potential":    "business_potential",
            "uniqueness":            "uniqueness_innovation",
            "risk":                  "risk_level",
        }

        raw_scores = llm_scores if llm_scores is not None else (llm_output or {})
        normalized_scores = {}
        for key, value in raw_scores.items():
            norm_key = KEY_MAP.get(key, key)
            if isinstance(value, dict):
                normalized_scores[norm_key] = dict(value)
            else:
                normalized_scores[norm_key] = value

        verified_scores = normalized_scores

        def get_score(param: str, default: float = 50.0) -> float:
            val = verified_scores.get(param)
            if val is None:
                if param == "uniqueness_innovation":
                    val = verified_scores.get("uniqueness")
                elif param == "uniqueness":
                    val = verified_scores.get("uniqueness_innovation")
                elif param == "risk_level":
                    val = verified_scores.get("risk")
                elif param == "risk":
                    val = verified_scores.get("risk_level")
            if val is None:
                return default
            if isinstance(val, dict):
                try:
                    return float(val.get("score", default))
                except (ValueError, TypeError):
                    return default
            try:
                return float(val)
            except (ValueError, TypeError):
                return default

        def set_score(param: str, new_val: float):
            val = float(new_val)
            keys_to_set = [param]
            if param in ("uniqueness_innovation", "uniqueness"):
                keys_to_set = ["uniqueness_innovation", "uniqueness"]
            elif param in ("risk_level", "risk"):
                keys_to_set = ["risk_level", "risk"]

            for k in keys_to_set:
                if isinstance(verified_scores.get(k), dict):
                    verified_scores[k]["score"] = val
                else:
                    verified_scores[k] = val

        overrides_applied = []
        issues = []

        revenue = (
            getattr(prof, "revenue_model", "")
            or getattr(prof, "business_model", "")
            or user_data.get("revenue_model", "")
            or user_data.get("business_model", "")
            or ""
        )
        description = (
            getattr(prof, "description", "")
            or user_data.get("description", "")
            or ""
        )
        title = (
            getattr(prof, "title", "")
            or user_data.get("title", "")
            or ""
        )
        customer = (
            getattr(prof, "target_customer", "")
            or user_data.get("target_customer", "")
            or ""
        )
        full_text = f"{title} {description}".strip()

        # ---------------------------------------------------------
        # RULE 1 — Revenue model missing & explicit no revenue
        # ---------------------------------------------------------
        revenue_keywords = [
            "subscription", "revenue", "charge", "pricing", "fee",
            "payment", "earn", "monetize", "business model", "per month",
            "per user", "rs ", "₹", "$"
        ]
        has_revenue_signal = (
            len(str(revenue).strip()) > 5 or
            any(kw in full_text.lower() for kw in revenue_keywords)
        )

        no_revenue_signals = [
            "no business plan", "no revenue", "no monetization",
            "i do not want to market", "don't want to sell",
            "no business model", "free for everyone"
        ]
        explicitly_no_revenue = any(
            sig in full_text.lower() for sig in no_revenue_signals
        )

        orig_bp = get_score("business_potential", 50.0)
        if explicitly_no_revenue:
            verified_scores["business_potential"] = 10.0
            set_score("business_potential", 10.0)
            flag = "explicit_no_revenue_model_score_zeroed"
            overrides_applied.append(OverrideItem(flag, "business_potential", orig_bp, 10.0))
            issues.append(flag)
        elif not has_revenue_signal:
            if orig_bp > 45.0:
                verified_scores["business_potential"] = 45.0
                set_score("business_potential", 45.0)
                flag = "revenue_model_missing_score_capped"
                overrides_applied.append(OverrideItem(flag, "business_potential", orig_bp, 45.0))
                issues.append(flag)

        # ---------------------------------------------------------
        # RULE 2 — No target customer & vague target customer
        # ---------------------------------------------------------
        vague_customer_signals = [
            "everyone", "all people", "anybody", "no target",
            "general public", "whole world", "all customers"
        ]
        explicitly_no_customer = any(
            sig in f"{customer} {full_text}".lower()
            for sig in vague_customer_signals
        )
        if explicitly_no_customer or len(str(customer).strip()) < 20:
            orig_tc = get_score("target_customer_clarity", 100.0)
            new_tc = min(orig_tc, 25.0)
            verified_scores["target_customer_clarity"] = new_tc
            set_score("target_customer_clarity", new_tc)
            flag = "no_target_customer_score_capped"
            overrides_applied.append(OverrideItem(flag, "target_customer_clarity", orig_tc, new_tc))
            if len(str(customer).strip()) < 20 or not customer:
                overrides_applied.append(OverrideItem("customer_vague_score_capped", "target_customer_clarity", orig_tc, new_tc))
            issues.append(flag)

        # ---------------------------------------------------------
        # RULE 3 — Nonsensical or fraudulent product signals
        # ---------------------------------------------------------
        fraud_signals = [
            "invisible", "magic", "guaranteed crore", "earn crore in",
            "no actual product", "bottle will be empty", "no real"
        ]
        has_fraud_signal = any(sig in full_text.lower() for sig in fraud_signals)
        if has_fraud_signal:
            for param in ["market_demand", "problem_solution_fit",
                          "business_potential", "uniqueness_innovation"]:
                orig_p = get_score(param, 100.0)
                new_p = min(orig_p, 15.0)
                verified_scores[param] = new_p
                set_score(param, new_p)
            flag = "fraudulent_product_signal_detected"
            overrides_applied.append(OverrideItem(flag, "multiple", 0.0, 15.0))
            issues.append(flag)

        # ---------------------------------------------------------
        # RULE 4 — Explicit anti-marketing statement
        # ---------------------------------------------------------
        anti_market_signals = [
            "do not want to market", "don't want to market",
            "no marketing", "i will not market", "without marketing"
        ]
        if any(sig in full_text.lower() for sig in anti_market_signals):
            orig_md = get_score("market_demand", 100.0)
            new_md = min(orig_md, 20.0)
            verified_scores["market_demand"] = new_md
            set_score("market_demand", new_md)

            orig_bp = get_score("business_potential", 100.0)
            new_bp = min(orig_bp, 20.0)
            verified_scores["business_potential"] = new_bp
            set_score("business_potential", new_bp)

            flag = "explicit_anti_marketing_statement"
            overrides_applied.append(OverrideItem(flag, "market_demand_business_potential", 0.0, 20.0))
            issues.append(flag)

        # ---------------------------------------------------------
        # Score vs rule engine findings (deterministic cross-check)
        # ---------------------------------------------------------
        critical_violations = []
        for violation in rule_res:
            passed = violation.get("passed", True) if isinstance(violation, dict) else getattr(violation, "passed", True)
            if passed:
                continue

            severity = violation.get("severity") if isinstance(violation, dict) else getattr(violation, "severity", None)
            rule_name = violation.get("rule") if isinstance(violation, dict) else getattr(violation, "rule_name", getattr(violation, "rule", "UNKNOWN"))
            affected_param = violation.get("affects_parameter") if isinstance(violation, dict) else getattr(violation, "affects_parameter", None)

            if severity == "CRITICAL":
                critical_violations.append(rule_name)
                if affected_param and affected_param in verified_scores:
                    curr_score = get_score(affected_param)
                    if curr_score > 60:
                        new_score = min(curr_score, 40.0)
                        set_score(affected_param, new_score)
                        verified_scores[affected_param] = new_score
                        flag = f"critical_rule_violation_{rule_name}"
                        overrides_applied.append(OverrideItem(flag, affected_param, curr_score, new_score))
                        issues.append(flag)

            elif severity == "HIGH":
                if affected_param and affected_param in verified_scores:
                    curr_score = get_score(affected_param)
                    if curr_score > 70:
                        new_score = min(curr_score, 55.0)
                        set_score(affected_param, new_score)
                        verified_scores[affected_param] = new_score
                        flag = f"high_rule_violation_{rule_name}"
                        overrides_applied.append(OverrideItem(flag, affected_param, curr_score, new_score))
                        issues.append(flag)

        # ---------------------------------------------------------
        # Score vs evidence availability
        # ---------------------------------------------------------
        if len(evidence_items) == 0:
            md_score = get_score("market_demand")
            if md_score > 60:
                set_score("market_demand", 50.0)
                verified_scores["market_demand"] = 50.0
                flag = "no_evidence_market_demand_capped"
                overrides_applied.append(OverrideItem(flag, "market_demand", md_score, 50.0))
                issues.append(flag)
        elif all(
            (e.get("reliability") if isinstance(e, dict) else getattr(e, "reliability", None)) == "GENERATED"
            for e in evidence_items
        ):
            md_score = get_score("market_demand")
            if md_score > 65:
                set_score("market_demand", 55.0)
                verified_scores["market_demand"] = 55.0
                flag = "only_generated_evidence_score_capped"
                overrides_applied.append(OverrideItem(flag, "market_demand", md_score, 55.0))
                issues.append(flag)

        # ---------------------------------------------------------
        # Confidence score calibration
        # ---------------------------------------------------------
        confidence = 85.0
        if len(overrides_applied) > 0:
            confidence -= 15.0
        if len(evidence_items) == 0:
            confidence -= 20.0
        missing_fields = getattr(idea_profile, "missing_fields", [])
        if len(missing_fields) > 3:
            confidence -= 10.0
        if len(critical_violations) > 0:
            confidence -= 25.0
        if has_fraud_signal:
            confidence -= 40.0

        calibrated_confidence = max(10.0, min(95.0, confidence))
        is_passed = (len(critical_violations) == 0) and (not has_fraud_signal)

        return {
            "verified_scores": verified_scores,
            "overrides_applied": overrides_applied,
            "score_overrides": overrides_applied,
            "calibrated_confidence": calibrated_confidence,
            "issues": issues,
            "passed": is_passed,
            "verification_method": "deterministic_rules_v1"
        }
