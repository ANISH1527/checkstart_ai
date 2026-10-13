from typing import Dict, Any
from app.services.llm_providers.base import LLMProvider


class MockProvider(LLMProvider):
    @property
    def provider_name(self) -> str:
        return "mock-llm"

    @property
    def model_version(self) -> str:
        return "2.0-profile-aware"

    def health_check(self) -> bool:
        return True

    def generate_validation_analysis(self, idea_data: Dict[str, Any], prompt_version: str = "v1.3") -> Dict[str, Any]:
        from app.services.idea_profile_service import IdeaProfileExtractor
        extractor = IdeaProfileExtractor()
        profile = extractor.extract_profile(idea_data)

        # 1. Market Demand
        if profile.is_vague or not profile.problem:
            demand = {
                "score": 35.0,
                "confidence": 40.0,
                "status": "PARTIALLY_SUPPORTED",
                "reason": "Market demand is estimated based on general local service patterns.",
                "assumptions": ["Consumers need local services."],
                "evidence_required": True
            }
        elif profile.target_customer and profile.target_customer not in ["students", "people", "users"]:
            demand = {
                "score": 82.0,
                "confidence": 85.0,
                "status": "SUPPORTED",
                "reason": f"Strong market demand for solving '{profile.problem}' among {profile.target_customer}.",
                "assumptions": [],
                "evidence_required": True
            }
        else:
            demand = {
                "score": 58.0,
                "confidence": 50.0,
                "status": "PARTIALLY_SUPPORTED",
                "reason": f"Market demand exists generally in {profile.industry or 'the sector'}, but needs validation.",
                "assumptions": [],
                "evidence_required": True
            }

        # 2. Problem-Solution Fit
        if profile.is_vague or not profile.solution:
            fit = {
                "score": 40.0,
                "confidence": 40.0,
                "status": "PARTIALLY_SUPPORTED",
                "reason": "General problem-solution connection inferred from common platform structures.",
                "assumptions": [],
                "evidence_required": True
            }
        else:
            fit = {
                "score": 85.0,
                "confidence": 85.0,
                "status": "SUPPORTED",
                "reason": f"Proposed solution directly addresses the stated problem: {profile.problem}.",
                "assumptions": ["Customers recognize the problem."],
                "evidence_required": False
            }

        # 3. Target Customer Clarity
        if profile.is_vague or not profile.target_customer:
            clarity = {
                "score": 60.0,
                "confidence": 40.0,
                "status": "PARTIALLY_SUPPORTED",
                "reason": "Target customer segment inferred broadly from general service category.",
                "assumptions": [],
                "evidence_required": True
            }
        elif profile.target_customer in ["students", "people", "users"]:
            clarity = {
                "score": 55.0,
                "confidence": 40.0,
                "status": "PARTIALLY_SUPPORTED",
                "reason": "'Students' is an overly broad customer category requiring demographic specification.",
                "assumptions": [],
                "evidence_required": True
            }
        else:
            clarity = {
                "score": 88.0,
                "confidence": 90.0,
                "status": "SUPPORTED",
                "reason": f"Clear target customer specification: {profile.target_customer}.",
                "assumptions": [],
                "evidence_required": False
            }

        # 4. Competition Environment
        if profile.is_vague:
            comp = {
                "score": 50.0,
                "confidence": 50.0,
                "status": "PARTIALLY_SUPPORTED",
                "reason": "Competes with existing incumbent offline and online service directories.",
                "assumptions": [],
                "evidence_required": True
            }
        else:
            comp = {
                "score": 65.0,
                "confidence": 70.0,
                "status": "PARTIALLY_SUPPORTED",
                "reason": f"Competes with incumbent solutions and alternative options in {profile.industry or 'the market'}.",
                "assumptions": ["Existing market solutions exist."],
                "evidence_required": True
            }

        # 5. Uniqueness
        if profile.is_vague or not profile.differentiation:
            unique = {
                "score": 40.0,
                "confidence": 40.0,
                "status": "PARTIALLY_SUPPORTED",
                "reason": "Standard service aggregation model with baseline differentiation.",
                "assumptions": [],
                "evidence_required": True
            }
        else:
            unique = {
                "score": 78.0,
                "confidence": 80.0,
                "status": "SUPPORTED",
                "reason": f"Distinctive value proposition: {profile.differentiation}.",
                "assumptions": [],
                "evidence_required": False
            }

        # 6. Technical Feasibility
        if profile.is_vague:
            tech = {
                "score": 50.0,
                "confidence": 50.0,
                "status": "SUPPORTED",
                "reason": "Standard mobile/web application architecture using existing frameworks.",
                "assumptions": [],
                "evidence_required": True
            }
        else:
            tech = {
                "score": 85.0,
                "confidence": 85.0,
                "status": "SUPPORTED",
                "reason": "Employs scalable enterprise cloud architecture.",
                "assumptions": [],
                "evidence_required": False
            }

        # 7. Business Potential
        if profile.is_vague or (not profile.revenue_model and not profile.pricing and not profile.business_model):
            biz = {
                "score": 68.0,
                "confidence": 45.0,
                "status": "PARTIALLY_SUPPORTED",
                "reason": "Standard transaction or commission fees assumed for service brokerage.",
                "assumptions": [],
                "evidence_required": True
            }
        else:
            biz = {
                "score": 82.0,
                "confidence": 85.0,
                "status": "SUPPORTED",
                "reason": f"Explicit revenue strategy: {profile.revenue_model or profile.pricing}.",
                "assumptions": [],
                "evidence_required": False
            }

        # 8. Scalability
        if profile.is_vague:
            scale = {
                "score": 45.0,
                "confidence": 50.0,
                "status": "PARTIALLY_SUPPORTED",
                "reason": "Geographic expansion allows gradual platform scaling.",
                "assumptions": [],
                "evidence_required": True
            }
        else:
            scale = {
                "score": 78.0,
                "confidence": 75.0,
                "status": "SUPPORTED",
                "reason": f"Scalable expansion strategy: {profile.scalability or 'digital platform expansion'}.",
                "assumptions": [],
                "evidence_required": False
            }

        # 9. Risk Level
        if profile.is_vague:
            risk = {
                "score": 60.0,
                "confidence": 50.0,
                "status": "PARTIALLY_SUPPORTED",
                "reason": "Customer retention and supply quality risks require attention.",
                "assumptions": [],
                "evidence_required": True
            }
        else:
            risk = {
                "score": 64.0,
                "confidence": 75.0,
                "status": "PARTIALLY_SUPPORTED",
                "reason": "Manageable execution and market adoption risks.",
                "assumptions": [],
                "evidence_required": False
            }

        # Dynamic Strengths
        if profile.is_vague:
            strengths = ["Concept addresses broad service market demand"]
        else:
            strengths = []
            if profile.target_customer and profile.target_customer not in ["students", "people"]:
                strengths.append(f"Clear target customer specification ({profile.target_customer})")
            if profile.solution:
                strengths.append(f"Defined solution approach ({profile.solution})")
            if profile.revenue_model:
                strengths.append(f"Explicit revenue model ({profile.revenue_model})")
            if not strengths:
                strengths = ["Core product concept registered"]

        # Dynamic Weaknesses
        if profile.is_vague:
            weaknesses = [
                "Core problem statement and value proposition are unspecified",
                "Target customer definition is overly broad",
                "Monetization and business model are completely unspecified",
                "Lack of technical or operational details"
            ]
        else:
            weaknesses = [
                "Requires empirical customer acquisition verification",
                "Competitive differentiation requires continuous feature delivery"
            ]

        # Dynamic Risks
        if profile.is_vague:
            risks = [
                "High risk of building a product with unvalidated customer demand",
                "Ambiguity around revenue generation and unit economics"
            ]
        else:
            risks = [
                "Enterprise sales cycle elongation",
                "Competitive response from incumbent market leaders"
            ]

        return {
            "market_demand": demand,
            "problem_solution_fit": fit,
            "target_customer_clarity": clarity,
            "competition": comp,
            "uniqueness": unique,
            "technical_feasibility": tech,
            "business_potential": biz,
            "scalability": scale,
            "risk": risk,
            "strengths": strengths,
            "weaknesses": weaknesses,
            "risks": risks,
            "information_gaps": profile.missing_information
        }
