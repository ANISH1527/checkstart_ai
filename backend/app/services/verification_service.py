from typing import Dict, Any, List


class VerificationService:
    def verify(
        self,
        user_input: Dict[str, Any],
        llm_output: Dict[str, Any],
        rule_results: List[Dict[str, Any]],
        idea_profile: Any = None
    ) -> Dict[str, Any]:
        if idea_profile is None:
            from app.services.idea_profile_service import IdeaProfileExtractor
            extractor = IdeaProfileExtractor()
            idea_profile = extractor.extract_profile(user_input)

        issues = []
        findings = {
            "FACT": [],
            "INFERENCE": [],
            "ASSUMPTION": [],
            "UNKNOWN": []
        }

        # Check required parameters exist in LLM response
        required_params = [
            "market_demand", "problem_solution_fit", "target_customer_clarity",
            "competition", "uniqueness", "technical_feasibility",
            "business_potential", "scalability", "risk"
        ]

        for param in required_params:
            if param not in llm_output:
                issues.append(f"Missing parameter in LLM analysis: {param}")
            else:
                score = llm_output[param].get("score")
                if not isinstance(score, (int, float)) or score < 0 or score > 100:
                    issues.append(f"Invalid score out of bounds (0-100) for parameter: {param}")
                
                status = llm_output[param].get("status")
                if status == "INSUFFICIENT_INFORMATION":
                    findings["UNKNOWN"].append(f"{param}: Insufficient information provided in submission.")

        # Classify user-provided vs inferred fields
        if getattr(idea_profile, "target_customer", None) and getattr(idea_profile, "target_customer") not in ["students", "people", "users"]:
            findings["FACT"].append(f"Target customer specified: {idea_profile.target_customer}")
        elif not user_input.get("target_customer"):
            findings["INFERENCE"].append("Target customer category inferred from text cues.")

        if getattr(idea_profile, "revenue_model", None):
            findings["FACT"].append(f"Revenue model specified: {idea_profile.revenue_model}")
        else:
            findings["UNKNOWN"].append("Revenue model and pricing strategy unspecified.")

        if getattr(idea_profile, "location", None):
            findings["FACT"].append(f"Launch location specified: {idea_profile.location}")

        # Check for ungrounded inference vs user input
        if not user_input.get("target_customer") and llm_output.get("target_customer_clarity", {}).get("score", 0) > 85:
            issues.append("INFERENCE_NOT_USER_PROVIDED: High customer clarity score given without explicit user customer input.")

        # Check rule conflicts
        critical_rule_failures = [r for r in rule_results if not r["passed"] and r["severity"] == "CRITICAL"]
        if critical_rule_failures:
            issues.append("CRITICAL_RULE_FAILURE: Security or input validity rule failed.")

        return {
            "passed": len(issues) == 0 or all("INFERENCE" in i for i in issues),
            "issues": issues,
            "findings": findings
        }
