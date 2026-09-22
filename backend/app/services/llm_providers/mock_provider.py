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

    def generate_validation_analysis(self, idea_data: Dict[str, Any], prompt_version: str = "v1.2") -> Dict[str, Any]:
        from app.services.idea_profile_service import IdeaProfileExtractor
        extractor = IdeaProfileExtractor()
        profile = extractor.extract_profile(idea_data)

        # 1. Market Demand
        if profile.is_vague or not profile.problem:
            demand = {
                "score": 30.0,
                "confidence": 20.0,
                "status": "INSUFFICIENT_INFORMATION",
                "reason": "Insufficient information: Core problem and target customer are insufficiently specified to assess market demand.",
                "assumptions": [],
                "evidence_required": True
            }
        elif profile.target_customer and profile.target_customer not in ["students", "people", "users"]:
            demand = {
                "score": 82.0,
                "confidence": 85.0,
                "status": "SUPPORTED",
                "reason": f"Strong market demand for solving '{profile.problem}' among {profile.target_customer}.",
                "assumptions": ["Target audience seeks affordable meal alternatives."],
                "evidence_required": True
            }
        else:
            demand = {
                "score": 55.0,
                "confidence": 50.0,
                "status": "PARTIALLY_SUPPORTED",
                "reason": f"Market demand exists generally in {profile.industry or 'the sector'}, but target audience pain point needs empirical validation.",
                "assumptions": [],
                "evidence_required": True
            }

        # 2. Problem-Solution Fit
        if profile.is_vague or not profile.solution:
            fit = {
                "score": 25.0,
                "confidence": 20.0,
                "status": "INSUFFICIENT_INFORMATION",
                "reason": "Insufficient information: Core problem and specific solution mechanism are not specified.",
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
                "score": 20.0,
                "confidence": 15.0,
                "status": "INSUFFICIENT_INFORMATION",
                "reason": "Insufficient information: Target customer profile is missing.",
                "assumptions": [],
                "evidence_required": True
            }
        elif profile.target_customer in ["students", "people", "users"]:
            clarity = {
                "score": 35.0,
                "confidence": 30.0,
                "status": "PARTIALLY_SUPPORTED",
                "reason": "'Students' is an overly broad customer category requiring demographic and situational specification.",
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
                "score": 30.0,
                "confidence": 15.0,
                "status": "INSUFFICIENT_INFORMATION",
                "reason": "Insufficient information: Product category is unspecified, making competitive assessment impossible.",
                "assumptions": [],
                "evidence_required": True
            }
        else:
            comp = {
                "score": 62.0,
                "confidence": 70.0,
                "status": "PARTIALLY_SUPPORTED",
                "reason": f"Competes with incumbent solutions and alternative options in {profile.industry or 'the market'}.",
                "assumptions": ["Existing market solutions exist."],
                "evidence_required": True
            }

        # 5. Uniqueness
        if profile.is_vague or not profile.differentiation:
            unique = {
                "score": 30.0,
                "confidence": 20.0,
                "status": "INSUFFICIENT_INFORMATION",
                "reason": "Insufficient information: No unique features, moat, or differentiators specified.",
                "assumptions": [],
                "evidence_required": True
            }
        else:
            unique = {
                "score": 76.0,
                "confidence": 80.0,
                "status": "SUPPORTED",
                "reason": f"Distinctive value proposition: {profile.differentiation}.",
                "assumptions": [],
                "evidence_required": False
            }

        # 6. Technical Feasibility
        if profile.is_vague:
            tech = {
                "score": 35.0,
                "confidence": 25.0,
                "status": "INSUFFICIENT_INFORMATION",
                "reason": "Insufficient information: Technical scope and application requirements are unspecified.",
                "assumptions": [],
                "evidence_required": True
            }
        else:
            tech = {
                "score": 85.0,
                "confidence": 85.0,
                "status": "SUPPORTED",
                "reason": "Employs standard scalable multi-sided platform architecture (catalog, orders, status tracking).",
                "assumptions": [],
                "evidence_required": False
            }

        # 7. Business Potential
        if profile.is_vague or (not profile.revenue_model and not profile.pricing and not profile.business_model):
            biz = {
                "score": 25.0,
                "confidence": 15.0,
                "status": "INSUFFICIENT_INFORMATION",
                "reason": "Insufficient information: Revenue model, pricing strategy, and monetization mechanism are unspecified.",
                "assumptions": [],
                "evidence_required": True
            }
        else:
            biz = {
                "score": 78.0,
                "confidence": 85.0,
                "status": "SUPPORTED",
                "reason": f"Explicit revenue strategy: {profile.revenue_model or profile.pricing}.",
                "assumptions": [],
                "evidence_required": False
            }

        # 8. Scalability
        if profile.is_vague:
            scale = {
                "score": 30.0,
                "confidence": 20.0,
                "status": "INSUFFICIENT_INFORMATION",
                "reason": "Insufficient information: Operational model details missing to evaluate scalability.",
                "assumptions": [],
                "evidence_required": True
            }
        else:
            scale = {
                "score": 74.0,
                "confidence": 75.0,
                "status": "SUPPORTED",
                "reason": f"Scalable expansion strategy: {profile.scalability or 'digital platform expansion'}.",
                "assumptions": [],
                "evidence_required": False
            }

        # 9. Risk Level
        if profile.is_vague:
            risk = {
                "score": 30.0,
                "confidence": 20.0,
                "status": "INSUFFICIENT_INFORMATION",
                "reason": "High risk level due to completely unspecified product concept, target customer, and business model.",
                "assumptions": [],
                "evidence_required": True
            }
        else:
            risk = {
                "score": 64.0,
                "confidence": 75.0,
                "status": "PARTIALLY_SUPPORTED",
                "reason": "Moderate risk associated with supply-side partner onboarding, food safety compliance, and unit economics.",
                "assumptions": [],
                "evidence_required": False
            }

        # Dynamic Strengths
        if profile.is_vague:
            strengths = ["App concept introduced for student demographic"]
        else:
            strengths = []
            if profile.target_customer and profile.target_customer not in ["students", "people"]:
                strengths.append(f"Clear target customer specification ({profile.target_customer})")
            if profile.solution and profile.supply_side:
                strengths.append(f"Defined marketplace model ({profile.solution})")
            if profile.revenue_model:
                strengths.append(f"Explicit revenue model ({profile.revenue_model})")
            if profile.location:
                strengths.append(f"Targeted launch location strategy ({profile.location})")
            if not strengths:
                strengths = ["Core product concept registered"]

        # Dynamic Weaknesses
        if profile.is_vague:
            weaknesses = [
                "Core problem statement and value proposition are unspecified",
                "Target customer definition ('students') is overly broad",
                "Monetization and business model are completely unspecified",
                "Lack of technical or operational details"
            ]
        else:
            weaknesses = [
                "Requires managing supply-side onboarding and quality control for home cooks",
                "Food safety and local regulatory compliance require formal verification",
                "Unit economics of local delivery fees require empirical testing"
            ]

        # Dynamic Risks
        if profile.is_vague:
            risks = [
                "High risk of building a product with zero market demand due to unvalidated problem",
                "Complete ambiguity around revenue generation and execution roadmap"
            ]
        else:
            risks = [
                "Supply-side partner churn or meal quality inconsistency",
                "Regulatory/health inspection compliance for home-cooked food sales",
                "Competition from established food delivery platforms and campus messes"
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
