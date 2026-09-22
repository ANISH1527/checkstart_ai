from typing import Dict, Any, List


class InformationGapService:
    def detect_gaps(
        self,
        idea_data: Dict[str, Any],
        llm_output: Dict[str, Any],
        idea_profile: Any = None
    ) -> List[Dict[str, Any]]:
        if idea_profile is None:
            from app.services.idea_profile_service import IdeaProfileExtractor
            extractor = IdeaProfileExtractor()
            idea_profile = extractor.extract_profile(idea_data)

        gaps = []

        # If concept is vague, return fundamental conceptual gaps
        if getattr(idea_profile, "is_vague", False):
            gaps.append({
                "category": "PROBLEM_DEFINITION",
                "priority": "HIGH",
                "question": "What specific problem does this application solve for users?",
                "reason": "The submission lacks a defined pain point or problem statement.",
                "validation_method": "Conduct 15 customer discovery interviews to identify a recurring problem."
            })
            gaps.append({
                "category": "TARGET_CUSTOMER",
                "priority": "HIGH",
                "question": "Which specific segment of students is the primary target audience?",
                "reason": "'Students' is an overly broad category with varying needs (e.g., dorm vs commuting).",
                "validation_method": "Define a specific student persona and situational context."
            })
            gaps.append({
                "category": "SOLUTION_SPECIFICATION",
                "priority": "HIGH",
                "question": "What are the core features and specific solution workflow?",
                "reason": "The submission only specifies a generic app without feature details.",
                "validation_method": "Draft a product requirements document (PRD) or wireframe prototype."
            })
            gaps.append({
                "category": "REVENUE_MODEL",
                "priority": "HIGH",
                "question": "How will the platform generate revenue and what is the pricing model?",
                "reason": "Monetization strategy is completely unspecified.",
                "validation_method": "Evaluate freemium, subscription, or transactional commission models."
            })
            gaps.append({
                "category": "DIFFERENTIATION",
                "priority": "HIGH",
                "question": "What makes this application unique compared to existing alternatives?",
                "reason": "No competitive moat or unique value proposition was identified.",
                "validation_method": "Perform a competitive landscape matrix mapping existing solutions."
            })
            return gaps

        # Specific gaps for detailed ideas based on missing profile components
        if not getattr(idea_profile, "pricing", None):
            gaps.append({
                "category": "WILLINGNESS_TO_PAY",
                "priority": "HIGH",
                "question": "What is the expected average order price and customer willingness to pay?",
                "reason": "Meal pricing tiers and price sensitivity are unspecified.",
                "validation_method": "Run price sensitivity survey (Van Westendorp meter) with target students."
            })

        if getattr(idea_profile, "supply_side", None) and "cook" in str(idea_profile.supply_side).lower():
            gaps.append({
                "category": "REGULATORY_COMPLIANCE",
                "priority": "HIGH",
                "question": "What are the local food safety, hygiene, and FSSAI registration requirements for home cooks?",
                "reason": "Home-cooked food sales require strict health and safety compliance.",
                "validation_method": "Consult local municipal & FSSAI regulatory compliance guidelines in Tamil Nadu."
            })
            gaps.append({
                "category": "UNIT_ECONOMICS",
                "priority": "HIGH",
                "question": "What are the exact unit economics per order after cook payout, 10% commission, and delivery fee?",
                "reason": "Delivery fee structures and margin split between cooks, drivers, and platform need testing.",
                "validation_method": "Model financial unit economics per order across 3 order volume tiers."
            })

        if not getattr(idea_profile, "location", None):
            gaps.append({
                "category": "GEOGRAPHIC_SCOPE",
                "priority": "MEDIUM",
                "question": "What is the initial launch city and pilot college campus target?",
                "reason": "Hyper-local marketplaces require dense geographical focus during launch.",
                "validation_method": "Select 1 primary college campus for initial pilot rollout."
            })

        # Integrate any missing information fields identified in idea_profile
        for missing in getattr(idea_profile, "missing_information", []):
            if not any(g["reason"] == missing for g in gaps):
                gaps.append({
                    "category": "MARKET_EVIDENCE",
                    "priority": "MEDIUM",
                    "question": f"How will you address: '{missing}'?",
                    "reason": missing,
                    "validation_method": "Execute targeted market research and empirical pilot testing."
                })

        return gaps
