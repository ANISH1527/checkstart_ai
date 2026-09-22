from typing import Dict, Any, List
from app.schemas.recommendation import ParameterRootCause, RootCauseItem


class RootCauseService:
    """
    Layer 12: Root-Cause / Weakness Analysis Service.
    Determines WHY each parameter received a low or medium score,
    linking root causes to profile data, information gaps, evidence, and similarity analysis.
    """

    def analyze_root_causes(
        self,
        scores: Dict[str, float],
        idea_dict: Dict[str, Any],
        idea_profile: Any,
        llm_analysis: Dict[str, Any],
        gaps: List[Dict[str, Any]],
        evidence_list: List[Dict[str, Any]],
        similarity_results: List[Dict[str, Any]],
        verification: Dict[str, Any]
    ) -> List[ParameterRootCause]:
        root_causes_list: List[ParameterRootCause] = []

        # Convert gaps to quick lookup set/dict
        gap_fields = {g.get("field") or g.get("parameter"): g for g in gaps if isinstance(g, dict)}

        for param, score in scores.items():
            if score >= 80.0:
                severity = "LOW"
            elif score >= 65.0:
                severity = "MEDIUM"
            elif score >= 45.0:
                severity = "HIGH"
            else:
                severity = "CRITICAL"

            causes: List[RootCauseItem] = []

            # Perform parameter-specific root cause analysis
            if param == "business_potential":
                pricing = getattr(idea_profile, "pricing", None) or idea_dict.get("pricing")
                revenue_model = getattr(idea_profile, "revenue_model", None) or idea_dict.get("revenue_model")
                biz_model = getattr(idea_profile, "business_model", None) or idea_dict.get("business_model")

                if not pricing or str(pricing).strip().lower() in ["none", "n/a", "undefined", "missing"]:
                    causes.append(RootCauseItem(
                        cause="Pricing model is not defined in the profile",
                        status="SUPPORTED",
                        source="idea_profile",
                        confidence=0.95
                    ))
                if not revenue_model or str(revenue_model).strip().lower() in ["none", "n/a", "undefined", "missing"]:
                    causes.append(RootCauseItem(
                        cause="Monetization mechanism and revenue model are undefined",
                        status="SUPPORTED",
                        source="idea_profile",
                        confidence=0.92
                    ))
                causes.append(RootCauseItem(
                    cause="Customer willingness-to-pay and unit economics are unknown",
                    status="UNKNOWN",
                    source="information_gap",
                    confidence=0.88
                ))

            elif param == "target_customer_clarity":
                customer = getattr(idea_profile, "target_customer", None) or idea_dict.get("target_customer", "")
                is_vague = getattr(idea_profile, "is_vague", False) or "everyone" in str(customer).lower() or len(str(customer)) < 15

                if is_vague:
                    causes.append(RootCauseItem(
                        cause="Target customer segment is overly broad or vague (e.g. 'everyone')",
                        status="SUPPORTED",
                        source="idea_profile",
                        confidence=0.95
                    ))
                if "buyer" not in str(customer).lower() and "user" not in str(customer).lower():
                    causes.append(RootCauseItem(
                        cause="Distinction between end-user and paying buyer is not specified",
                        status="LIKELY",
                        source="llm_analysis",
                        confidence=0.85
                    ))
                causes.append(RootCauseItem(
                    cause="Specific customer demographic, geographic, or behavioral filters are missing",
                    status="UNKNOWN",
                    source="information_gap",
                    confidence=0.87
                ))

            elif param == "market_demand":
                problem = getattr(idea_profile, "problem", None) or idea_dict.get("problem", "")
                if len(str(problem)) < 25:
                    causes.append(RootCauseItem(
                        cause="Problem statement lacks empirical evidence of customer urgency",
                        status="SUPPORTED",
                        source="idea_profile",
                        confidence=0.90
                    ))
                causes.append(RootCauseItem(
                    cause="Quantitative market size or demand indicators were not provided",
                    status="UNKNOWN",
                    source="information_gap",
                    confidence=0.86
                ))

            elif param == "uniqueness":
                differentiator = getattr(idea_profile, "differentiator", None)
                high_sim = [s for s in similarity_results if s.get("similarity_score", 0) > 0.65]

                if high_sim:
                    causes.append(RootCauseItem(
                        cause=f"High semantic similarity detected with existing solutions ({len(high_sim)} direct repository matches)",
                        status="SUPPORTED",
                        source="similarity_results",
                        confidence=0.92
                    ))
                if not differentiator or str(differentiator).strip().lower() in ["none", "n/a", "undefined"]:
                    causes.append(RootCauseItem(
                        cause="Unique value proposition or competitive moat is undefined",
                        status="SUPPORTED",
                        source="idea_profile",
                        confidence=0.89
                    ))

            elif param == "competition":
                high_sim = [s for s in similarity_results if s.get("similarity_score", 0) > 0.60]
                if high_sim:
                    causes.append(RootCauseItem(
                        cause=f"Detected {len(high_sim)} internal repository solutions with overlapping features",
                        status="SUPPORTED",
                        source="similarity_results",
                        confidence=0.90
                    ))
                causes.append(RootCauseItem(
                    cause="Direct side-by-side competitor comparison matrix is missing",
                    status="UNKNOWN",
                    source="information_gap",
                    confidence=0.85
                ))

            elif param == "technical_feasibility":
                tech = getattr(idea_profile, "technology", None) or idea_dict.get("technology", "")
                if not tech or str(tech).strip().lower() in ["none", "n/a", "undefined"] or len(str(tech)) < 10:
                    causes.append(RootCauseItem(
                        cause="Required technical stack, infrastructure, or architecture is unstated",
                        status="SUPPORTED",
                        source="idea_profile",
                        confidence=0.93
                    ))
                causes.append(RootCauseItem(
                    cause="Implementation complexity, prototype status, or resource requirements are unverified",
                    status="UNKNOWN",
                    source="information_gap",
                    confidence=0.88
                ))

            elif param == "scalability":
                causes.append(RootCauseItem(
                    cause="Operational dependencies and customer acquisition scaling bottlenecks are undefined",
                    status="LIKELY",
                    source="llm_analysis",
                    confidence=0.82
                ))
                causes.append(RootCauseItem(
                    cause="Cost structure per additional unit/customer has not been estimated",
                    status="UNKNOWN",
                    source="information_gap",
                    confidence=0.85
                ))

            elif param == "problem_solution_fit":
                solution = getattr(idea_profile, "solution", None) or idea_dict.get("solution", "")
                if len(str(solution)) < 20:
                    causes.append(RootCauseItem(
                        cause="Solution details do not directly address all core aspects of the stated problem",
                        status="SUPPORTED",
                        source="idea_profile",
                        confidence=0.88
                    ))

            elif param == "risk":
                if score < 70.0:
                    causes.append(RootCauseItem(
                        cause="Execution, regulatory, or market adoption risks lack mitigation strategies",
                        status="LIKELY",
                        source="llm_analysis",
                        confidence=0.84
                    ))

            # Default generic fallback for any weak score without specific causes
            if not causes and severity in ["CRITICAL", "HIGH", "MEDIUM"]:
                param_reason = llm_analysis.get(param, {}).get("reason", f"Score of {score} indicates areas for improvement.")
                causes.append(RootCauseItem(
                    cause=param_reason,
                    status="LIKELY",
                    source="llm_analysis",
                    confidence=0.80
                ))

            root_causes_list.append(ParameterRootCause(
                parameter=param,
                score=score,
                severity=severity,
                root_causes=causes
            ))

        return root_causes_list
