from typing import Dict, Any


class ReportService:
    def generate_markdown_report(self, validation_response: Dict[str, Any]) -> str:
        lines = []
        lines.append(f"# Startup Idea Validation Report (Version {validation_response.get('version', 1)})")
        lines.append(f"**Overall Validation Score:** {validation_response.get('overall_score')}/100")
        lines.append(f"**Classification:** {validation_response.get('classification')}")
        lines.append(f"**Confidence Level:** {validation_response.get('confidence_score')}%\n")

        lines.append("## Parameter Breakdown")
        for param, score in validation_response.get("scores", {}).items():
            lines.append(f"- **{param.replace('_', ' ').title()}:** {score}/100")

        lines.append("\n## Actionable Recommendations")
        for rec in validation_response.get("recommendations", []):
            lines.append(f"### [{rec.get('priority')}] {rec.get('category')}")
            lines.append(f"**Action:** {rec.get('action')}")
            lines.append(f"**Success Metric:** {rec.get('success_metric')}\n")

        return "\n".join(lines)
