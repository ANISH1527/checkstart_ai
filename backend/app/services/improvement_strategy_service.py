import uuid
from typing import Dict, Any, List
from app.schemas.recommendation import ParameterRootCause, StructuredRecommendation


class ImprovementStrategyService:
    """
    Layer 13: Improvement Strategy Engine Service.
    Converts parameter root causes and information gaps into evidence-aware, actionable improvement strategies.
    Ensures non-guarantee wording (e.g. 'may improve', 'is expected to improve') and parameter specific steps.
    """

    def generate_strategies(
        self,
        root_causes: List[ParameterRootCause],
        gaps: List[Dict[str, Any]],
        idea_dict: Dict[str, Any],
        idea_profile: Any
    ) -> List[StructuredRecommendation]:
        recommendations: List[StructuredRecommendation] = []
        rec_index = 1

        for prc in root_causes:
            if prc.severity not in ["CRITICAL", "HIGH", "MEDIUM"]:
                continue

            param = prc.parameter
            score = prc.score

            # Pick primary root cause text
            primary_cause = prc.root_causes[0].cause if prc.root_causes else f"Score of {score} indicates weakness."

            if param == "business_potential":
                rec = StructuredRecommendation(
                    id=f"rec_{rec_index:03d}",
                    parameter=param,
                    category=param.upper(),
                    current_score=score,
                    severity=prc.severity,
                    root_cause=primary_cause,
                    missing_information="Customer willingness-to-pay and unit economics data",
                    objective="Establish whether target customers are willing to pay for this solution",
                    action="Interview at least 5 target customers and test 2 explicit pricing options (e.g. $10/mo vs $25/mo)",
                    priority=prc.severity,
                    effort="MEDIUM",
                    why_it_matters="Revenue feasibility cannot be assessed confidently without empirical pricing evidence",
                    validation_method="Record customer pricing responses and calculate estimated gross margins",
                    expected_impact="May improve evidence quality and business-potential assessment confidence",
                    affected_parameters=["business_potential", "business_model"],
                    confidence=0.88,
                    status="OPEN"
                )
                recommendations.append(rec)
                rec_index += 1

            elif param == "target_customer_clarity":
                rec = StructuredRecommendation(
                    id=f"rec_{rec_index:03d}",
                    parameter=param,
                    category=param.upper(),
                    current_score=score,
                    severity=prc.severity,
                    root_cause=primary_cause,
                    missing_information="Specific buyer persona, demographic, or geographic boundaries",
                    objective="Define a narrow primary customer segment and distinguish user from buyer",
                    action="Define a single niche customer profile (e.g., 'first-year dorm students in Tier-2 Indian cities') and document buyer vs user roles",
                    priority=prc.severity,
                    effort="LOW",
                    why_it_matters="Vague target customer definitions dilute product positioning and customer acquisition strategy",
                    validation_method="Create 1-page persona sheet with demographic, pain-point, and purchasing authority criteria",
                    expected_impact="Is expected to improve customer clarity, market demand, and business potential focus",
                    affected_parameters=["target_customer_clarity", "market_demand", "business_potential"],
                    confidence=0.90,
                    status="OPEN"
                )
                recommendations.append(rec)
                rec_index += 1

            elif param == "market_demand":
                rec = StructuredRecommendation(
                    id=f"rec_{rec_index:03d}",
                    parameter=param,
                    category=param.upper(),
                    current_score=score,
                    severity=prc.severity,
                    root_cause=primary_cause,
                    missing_information="Empirical proof of problem frequency and urgency",
                    objective="Validate problem frequency and measure customer pain intensity",
                    action="Conduct 10 structured interviews or survey 25 target users focusing on current workarounds and pain frequency",
                    priority=prc.severity,
                    effort="MEDIUM",
                    why_it_matters="Building solutions for non-urgent problems leads to low adoption and poor retention",
                    validation_method="Collect qualitative problem ratings (>= 8/10 severity) and document current workaround expenses",
                    expected_impact="Would provide empirical evidence for market demand and problem-solution fit",
                    affected_parameters=["market_demand", "problem_solution_fit"],
                    confidence=0.86,
                    status="OPEN"
                )
                recommendations.append(rec)
                rec_index += 1

            elif param == "uniqueness":
                rec = StructuredRecommendation(
                    id=f"rec_{rec_index:03d}",
                    parameter=param,
                    category=param.upper(),
                    current_score=score,
                    severity=prc.severity,
                    root_cause=primary_cause,
                    missing_information="Clear competitive moat and defensible differentiator",
                    objective="Define 2-3 specific features or strategic advantages that competing solutions lack",
                    action="Compare top 3 existing alternatives and define your unique value proposition (e.g., 10x faster execution, proprietary dataset, or localized workflow)",
                    priority=prc.severity,
                    effort="MEDIUM",
                    why_it_matters="Without a clear differentiator, customers will default to established market leaders",
                    validation_method="Map out feature matrix vs top competitors highlighting proprietary advantages",
                    expected_impact="May improve uniqueness score and strengthen competitive positioning",
                    affected_parameters=["uniqueness", "competition"],
                    confidence=0.85,
                    status="OPEN"
                )
                recommendations.append(rec)
                rec_index += 1

            elif param == "competition":
                rec = StructuredRecommendation(
                    id=f"rec_{rec_index:03d}",
                    parameter=param,
                    category=param.upper(),
                    current_score=score,
                    severity=prc.severity,
                    root_cause=primary_cause,
                    missing_information="Detailed competitor landscape and alternative solution analysis",
                    objective="Analyze internal repository matches and market alternatives to identify service gaps",
                    action="Perform side-by-side comparison of 3 direct or indirect competitors and identify underserved user needs",
                    priority=prc.severity,
                    effort="LOW",
                    why_it_matters="Ignoring existing market alternatives leads to redundant feature development",
                    validation_method="Document competitor pricing, feature gaps, and negative user reviews",
                    expected_impact="Is expected to reduce competitive overlap uncertainty",
                    affected_parameters=["competition", "uniqueness"],
                    confidence=0.87,
                    status="OPEN"
                )
                recommendations.append(rec)
                rec_index += 1

            elif param == "technical_feasibility":
                rec = StructuredRecommendation(
                    id=f"rec_{rec_index:03d}",
                    parameter=param,
                    category=param.upper(),
                    current_score=score,
                    severity=prc.severity,
                    root_cause=primary_cause,
                    missing_information="Technical architecture details, APIs, and infrastructure requirements",
                    objective="De-risk technical execution by defining stack architecture or building a proof-of-concept",
                    action="Specify core technology stack (framework, database, AI model APIs) and prototype key technical workflow",
                    priority=prc.severity,
                    effort="HIGH",
                    why_it_matters="Unclear technical feasibility increases risk of cost overruns and execution failure",
                    validation_method="Build working MVP prototype or technical architecture document with API flow diagram",
                    expected_impact="May reduce technical complexity concerns and improve feasibility assessment",
                    affected_parameters=["technical_feasibility", "scalability"],
                    confidence=0.89,
                    status="OPEN"
                )
                recommendations.append(rec)
                rec_index += 1

            elif param == "scalability":
                rec = StructuredRecommendation(
                    id=f"rec_{rec_index:03d}",
                    parameter=param,
                    category=param.upper(),
                    current_score=score,
                    severity=prc.severity,
                    root_cause=primary_cause,
                    missing_information="Automation plan for manual operations and growth cost structure",
                    objective="Identify operational bottlenecks and plan automated workflows",
                    action="Document step-by-step customer onboarding pipeline and identify manual tasks to automate",
                    priority=prc.severity,
                    effort="MEDIUM",
                    why_it_matters="High manual operational overhead limits growth and reduces profit margins at scale",
                    validation_method="Estimate marginal cost per additional 100 users and outline automated pipeline",
                    expected_impact="Could improve scalability evaluation and long-term operating margin projections",
                    affected_parameters=["scalability", "technical_feasibility"],
                    confidence=0.84,
                    status="OPEN"
                )
                recommendations.append(rec)
                rec_index += 1

            elif param == "problem_solution_fit":
                rec = StructuredRecommendation(
                    id=f"rec_{rec_index:03d}",
                    parameter=param,
                    category=param.upper(),
                    current_score=score,
                    severity=prc.severity,
                    root_cause=primary_cause,
                    missing_information="Detailed alignment between customer pain points and proposed solution features",
                    objective="Map core problem statements directly to specific functional solution capabilities",
                    action="Create a Problem-Solution matrix connecting each identified user pain directly to a core product feature",
                    priority=prc.severity,
                    effort="LOW",
                    why_it_matters="Mismatched features waste development resources on non-essential capabilities",
                    validation_method="Validate feature alignment matrix with 5 target users",
                    expected_impact="May improve problem-solution fit and customer satisfaction",
                    affected_parameters=["problem_solution_fit", "target_customer_clarity"],
                    confidence=0.85,
                    status="OPEN"
                )
                recommendations.append(rec)
                rec_index += 1

            elif param == "risk":
                rec = StructuredRecommendation(
                    id=f"rec_{rec_index:03d}",
                    parameter=param,
                    category=param.upper(),
                    current_score=score,
                    severity=prc.severity,
                    root_cause=primary_cause,
                    missing_information="Risk identification and mitigation strategy",
                    objective="Develop mitigation strategies for top regulatory, technical, or market risks",
                    action="Draft a 1-page risk mitigation checklist addressing compliance, data privacy, and vendor lock-in",
                    priority=prc.severity,
                    effort="LOW",
                    why_it_matters="Unmitigated risks can stall launch or lead to legal/operational roadblocks",
                    validation_method="Review compliance requirements or industry standards for target domain",
                    expected_impact="Is expected to reduce overall risk uncertainty",
                    affected_parameters=["risk"],
                    confidence=0.83,
                    status="OPEN"
                )
                recommendations.append(rec)
                rec_index += 1

        return recommendations
