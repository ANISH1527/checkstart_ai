from typing import Dict, Any


class ReportService:
    def generate_markdown_report(self, validation_response: Dict[str, Any]) -> str:
        lines = []
        lines.append(f"# Startup Idea Validation Report (Version {validation_response.get('version', 1)})")
        
        ov = validation_response.get('overall_score') or validation_response.get('overallScore') or 0.0
        try:
            ov_float = float(ov)
            ov_norm = round(ov_float / 10.0, 1) if ov_float > 10 else round(ov_float, 1)
            ov_pct = round(ov_float if ov_float > 10 else ov_float * 10)
            lines.append(f"**Overall Validation Score:** {ov_pct}% ({ov_norm:.1f}/10)")
        except (ValueError, TypeError):
            lines.append(f"**Overall Validation Score:** {ov}")

        lines.append(f"**Classification:** {validation_response.get('classification')}")
        lines.append(f"**Confidence Level:** {validation_response.get('confidence_score')}%\n")

        lines.append("## Parameter Breakdown")
        raw_scores = validation_response.get("detailed_scores") or validation_response.get("scores", {})
        if isinstance(raw_scores, list):
            scores_dict = {s.get("parameter", "Unknown"): s.get("score", 0.0) for s in raw_scores if isinstance(s, dict)}
        elif isinstance(raw_scores, dict):
            scores_dict = raw_scores
        else:
            scores_dict = {}

        labels = {
            "market_demand": "Market Demand",
            "marketDemand": "Market Demand",
            "problem_solution_fit": "Problem-Solution Fit",
            "problemSeverity": "Problem-Solution Fit",
            "target_customer_clarity": "Target Customer Clarity",
            "targetCustomer": "Target Customer Clarity",
            "competition": "Competition & Moat",
            "uniqueness_innovation": "Uniqueness & Innovation",
            "uniqueness": "Uniqueness & Innovation",
            "innovation": "Uniqueness & Innovation",
            "technical_feasibility": "Technical Feasibility",
            "feasibility": "Technical Feasibility",
            "business_potential": "Business Potential",
            "revenuePotential": "Business Potential",
            "scalability": "Scalability",
            "risk_level": "Risk Level",
            "risk": "Risk Level",
        }

        for param, score in scores_dict.items():
            param_label = labels.get(param, str(param).replace('_', ' ').title())
            try:
                s_float = float(score)
                s_norm = round(s_float / 10.0, 1) if s_float > 10 else round(s_float, 1)
                lines.append(f"- **{param_label}:** {s_norm:.1f}/10")
            except (ValueError, TypeError):
                lines.append(f"- **{param_label}:** {score}")

        lines.append("\n## Actionable Recommendations")
        for rec in validation_response.get("recommendations", []):
            lines.append(f"### [{rec.get('priority')}] {rec.get('category')}")
            lines.append(f"**Action:** {rec.get('action')}")
            lines.append(f"**Success Metric:** {rec.get('success_metric')}\n")

        return "\n".join(lines)
