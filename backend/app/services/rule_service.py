from typing import Dict, Any, List
from app.utils.validators import detect_prompt_injection


class RuleService:
    def evaluate_rules(
        self,
        idea_data: Dict[str, Any],
        similarity_results: List[Dict[str, Any]],
        idea_profile: Any = None
    ) -> List[Dict[str, Any]]:
        if idea_profile is None:
            from app.services.idea_profile_service import IdeaProfileExtractor
            extractor = IdeaProfileExtractor()
            idea_profile = extractor.extract_profile(idea_data)

        text = f"{idea_data.get('title', '')} {idea_data.get('description', '')}".strip()
        word_count = getattr(idea_profile, "word_count", len(text.split()))

        rule_results = []

        # Rule 1: Minimum length check
        if word_count < 10:
            rule_results.append({
                "rule": "MINIMUM_LENGTH",
                "passed": False,
                "severity": "HIGH",
                "message": "Startup description is too short for meaningful analysis (minimum 10 words required)."
            })
        else:
            rule_results.append({
                "rule": "MINIMUM_LENGTH",
                "passed": True,
                "severity": "LOW",
                "message": "Minimum length requirement satisfied."
            })

        # Rule 2: Maximum length check
        if word_count > 3000:
            rule_results.append({
                "rule": "MAXIMUM_LENGTH",
                "passed": False,
                "severity": "MEDIUM",
                "message": "Submission exceeds max limit of 3000 words."
            })

        # Rule 3: Missing Problem definition
        problem = idea_data.get("problem")
        if not problem or len(problem.strip()) < 5:
            rule_results.append({
                "rule": "PROBLEM_MISSING",
                "passed": False,
                "severity": "HIGH",
                "message": "Problem statement is missing or insufficiently described."
            })
        else:
            rule_results.append({
                "rule": "PROBLEM_MISSING",
                "passed": True,
                "severity": "LOW",
                "message": "Problem statement provided."
            })

        # Rule 4: Missing Target Customer definition
        target = idea_data.get("target_customer")
        if not target or len(target.strip()) < 5:
            rule_results.append({
                "rule": "TARGET_CUSTOMER_MISSING",
                "passed": False,
                "severity": "MEDIUM",
                "message": "Target customer profile is not clearly specified."
            })
        else:
            rule_results.append({
                "rule": "TARGET_CUSTOMER_MISSING",
                "passed": True,
                "severity": "LOW",
                "message": "Target customer defined."
            })

        # Rule 5: Solution details check
        solution = idea_data.get("solution")
        if not solution or len(solution.strip()) < 5:
            rule_results.append({
                "rule": "SOLUTION_MISSING",
                "passed": False,
                "severity": "MEDIUM",
                "message": "Solution approach details are sparse or missing."
            })

        # Rule 6: High similarity check
        high_sim = [s for s in similarity_results if s.get("category") == "HIGH"]
        if high_sim:
            rule_results.append({
                "rule": "HIGH_SIMILARITY_WARNING",
                "passed": False,
                "severity": "HIGH",
                "message": f"High semantic similarity detected with {len(high_sim)} existing startup ideas."
            })
        else:
            rule_results.append({
                "rule": "HIGH_SIMILARITY_WARNING",
                "passed": True,
                "severity": "LOW",
                "message": "No duplicate or highly similar idea found in repository."
            })

        # Rule 7: Security check for prompt injection
        if detect_prompt_injection(text):
            rule_results.append({
                "rule": "SECURITY_PROMPT_INJECTION",
                "passed": False,
                "severity": "CRITICAL",
                "message": "Malicious prompt injection keywords detected."
            })

        return rule_results
