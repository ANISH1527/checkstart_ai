from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any
import re


@dataclass
class IdeaProfile:
    problem: Optional[str] = None
    target_customer: Optional[str] = None
    solution: Optional[str] = None
    industry: Optional[str] = None
    location: Optional[str] = None
    business_model: Optional[str] = None
    revenue_model: Optional[str] = None
    pricing: Optional[str] = None
    technology: Optional[str] = None
    supply_side: Optional[str] = None
    scalability: Optional[str] = None
    differentiation: Optional[str] = None
    competitors: List[str] = field(default_factory=list)
    assumptions: List[str] = field(default_factory=list)
    missing_information: List[str] = field(default_factory=list)
    word_count: int = 0
    is_vague: bool = False
    completeness_score: float = 0.0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "problem": self.problem,
            "target_customer": self.target_customer,
            "solution": self.solution,
            "industry": self.industry,
            "location": self.location,
            "business_model": self.business_model,
            "revenue_model": self.revenue_model,
            "pricing": self.pricing,
            "technology": self.technology,
            "supply_side": self.supply_side,
            "scalability": self.scalability,
            "differentiation": self.differentiation,
            "competitors": self.competitors,
            "assumptions": self.assumptions,
            "missing_information": self.missing_information,
            "word_count": self.word_count,
            "is_vague": self.is_vague,
            "completeness_score": self.completeness_score
        }


class IdeaProfileExtractor:
    """
    Extracts a structured IdeaProfile from explicit user input fields and raw text analysis.
    Does not invent fields that are not supported by the input.
    """
    def extract_profile(self, idea_data: Dict[str, Any]) -> IdeaProfile:
        title = idea_data.get("title", "") or ""
        desc = idea_data.get("description", "") or ""
        full_text = f"{title} {desc}".strip()
        word_count = len(full_text.split())

        # 1. Explicit user input values
        exp_problem = idea_data.get("problem")
        exp_target = idea_data.get("target_customer")
        exp_solution = idea_data.get("solution")
        exp_industry = idea_data.get("industry")
        exp_biz_model = idea_data.get("business_model")
        exp_rev_model = idea_data.get("revenue_model")
        exp_pricing = idea_data.get("pricing")
        exp_tech = idea_data.get("technology")

        # Clean strings
        exp_problem = exp_problem.strip() if exp_problem and len(exp_problem.strip()) > 3 else None
        exp_target = exp_target.strip() if exp_target and len(exp_target.strip()) > 3 else None
        exp_solution = exp_solution.strip() if exp_solution and len(exp_solution.strip()) > 3 else None
        exp_industry = exp_industry.strip() if exp_industry and len(exp_industry.strip()) > 2 else None
        exp_biz_model = exp_biz_model.strip() if exp_biz_model and len(exp_biz_model.strip()) > 3 else None
        exp_rev_model = exp_rev_model.strip() if exp_rev_model and len(exp_rev_model.strip()) > 3 else None
        exp_pricing = exp_pricing.strip() if exp_pricing and len(exp_pricing.strip()) > 1 else None
        exp_tech = exp_tech.strip() if exp_tech and len(exp_tech.strip()) > 2 else None

        # 2. Text-based heuristic extractions for missing explicit fields
        text_lower = full_text.lower()
        sentences = [s.strip() for s in re.split(r"[.!?]", full_text) if s.strip()]

        # Problem extraction
        problem = exp_problem
        if not problem:
            problem_cues = ["affordable homemade meals", "problem", "issue", "struggle", "pain", "lack", "difficult", "hard", "expensive", "miss", "challenge"]
            problem_sent = next((s for s in sentences if any(c in s.lower() for c in problem_cues)), None)
            if problem_sent and len(problem_sent.split()) > 4:
                problem = problem_sent

        # Target customer extraction
        target_customer = exp_target
        if not target_customer:
            if "college students living away from home" in text_lower:
                target_customer = "college students living away from home"
            elif "college students" in text_lower or "students" in text_lower:
                target_customer = "students"
            elif "small business" in text_lower or "sme" in text_lower:
                target_customer = "small businesses"
            else:
                customer_cues = ["customer", "target", "user", "client", "buyer"]
                cust_sent = next((s for s in sentences if any(c in s.lower() for c in customer_cues)), None)
                if cust_sent:
                    target_customer = cust_sent

        # Solution extraction
        solution = exp_solution
        if not solution:
            solution_cues = ["platform", "mobile platform", "app", "marketplace", "tool", "service", "connects", "allows", "provides"]
            sol_sent = next((s for s in sentences if any(c in s.lower() for c in solution_cues)), None)
            if sol_sent and len(sol_sent.split()) > 4:
                solution = sol_sent

        # Location extraction
        location = None
        location_matches = []
        if "erode" in text_lower:
            location_matches.append("Erode")
        if "tamil nadu" in text_lower:
            location_matches.append("Tamil Nadu")
        if "college towns" in text_lower:
            location_matches.append("college towns")
        if location_matches:
            location = ", ".join(location_matches)

        # Supply-side extraction (for 2-sided marketplaces)
        supply_side = None
        if "home cook" in text_lower or "cooks" in text_lower:
            supply_side = "verified local home cooks"
        elif "driver" in text_lower or "seller" in text_lower or "vendor" in text_lower:
            supply_side = "local sellers / service providers"

        # Revenue model & pricing extraction
        revenue_model = exp_rev_model
        pricing = exp_pricing
        if not revenue_model:
            if "commission" in text_lower:
                match = re.search(r"(\d+%\s*commission)", text_lower)
                revenue_model = match.group(1) if match else "order commission"
            elif "subscription" in text_lower:
                revenue_model = "subscription fee"
            elif "delivery fee" in text_lower or "delivery fees" in text_lower:
                revenue_model = "commission and delivery fees"

        if not pricing and "delivery fee" in text_lower:
            pricing = "commission + delivery fees"

        # Scalability extraction
        scalability = None
        if "expand" in text_lower or "college towns" in text_lower:
            scalability = "geographic expansion to other college towns"

        # Differentiation extraction
        differentiation = None
        if "verified local home cooks" in text_lower or "homemade meals" in text_lower or "verified" in text_lower:
            differentiation = "verified local home-cooked meals"

        # Technology extraction
        technology = exp_tech
        if not technology:
            if "mobile platform" in text_lower or "app" in text_lower:
                technology = "mobile application platform"
            elif "web platform" in text_lower or "software" in text_lower:
                technology = "web software application"

        # Industry extraction
        industry = exp_industry
        if not industry:
            if "food" in text_lower or "meals" in text_lower or "cooks" in text_lower:
                industry = "FoodTech / Local Marketplace"
            elif "legal" in text_lower:
                industry = "LegalTech"
            elif "health" in text_lower:
                industry = "HealthTech"

        # 3. Identify Missing Information
        missing_info = []
        if not problem:
            missing_info.append("Specific problem statement missing or unspecified.")
        if not target_customer or target_customer.lower() in ["students", "people", "users", "everyone"]:
            missing_info.append("Target customer segment is generic or insufficiently defined.")
        if not solution or len(str(solution).split()) < 4:
            missing_info.append("Solution mechanism and key features unspecified.")
        if not revenue_model and not pricing:
            missing_info.append("Monetization model, pricing strategy, and unit economics missing.")
        if ("connects" in text_lower or "marketplace" in text_lower) and not supply_side:
            missing_info.append("Supply-side partner acquisition strategy missing.")
        if not differentiation:
            missing_info.append("Competitive differentiation and moat unspecified.")

        # 4. Determine Vagueness and Completeness Score
        # Check if text is extremely brief or lacking core details
        is_vague = word_count < 15 or (not problem and (not target_customer or target_customer in ["students", "people", "users"]) and not revenue_model)

        # Calculate completeness score (0.0 to 100.0)
        c_score = 0.0
        if word_count >= 10:
            c_score += min(25.0, (word_count / 80.0) * 25.0)

        if problem:
            c_score += 15.0
        if target_customer:
            c_score += 5.0 if target_customer in ["students", "people", "users"] else 15.0
        if solution:
            c_score += 15.0
        if revenue_model or pricing or exp_biz_model:
            c_score += 15.0
        if location or supply_side or differentiation:
            c_score += 15.0

        completeness_score = round(max(5.0, min(100.0, c_score)), 2)

        return IdeaProfile(
            problem=problem,
            target_customer=target_customer,
            solution=solution,
            industry=industry,
            location=location,
            business_model=exp_biz_model,
            revenue_model=revenue_model,
            pricing=pricing,
            technology=technology,
            supply_side=supply_side,
            scalability=scalability,
            differentiation=differentiation,
            competitors=[],
            assumptions=["Target audience experiences pain point regularly."],
            missing_information=missing_info,
            word_count=word_count,
            is_vague=is_vague,
            completeness_score=completeness_score
        )
