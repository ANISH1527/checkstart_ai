from typing import Dict, Any, Optional
from app.core.config import settings
from app.core.logging import logger, struct_logger
from app.prompts.prompt_versions import get_prompt
from app.utils.json_utils import parse_llm_json
from app.services.llm_providers.base import LLMProvider
from app.services.llm_providers.mock_provider import MockProvider


class GeminiProvider(LLMProvider):
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or getattr(settings, "GEMINI_API_KEY", "")

    @property
    def provider_name(self) -> str:
        return "gemini-pro"

    @property
    def model_version(self) -> str:
        return "v1"

    def health_check(self) -> bool:
        if not self.api_key or self.api_key.strip() in ["", "none", "n/a"]:
            return False
        try:
            import google.generativeai as genai
            genai.configure(api_key=self.api_key)
            model = genai.GenerativeModel(self.provider_name)
            # Lightweight health check
            res = model.generate_content("ping", generation_config={"max_output_tokens": 1})
            return bool(res and res.text)
        except Exception as e:
            logger.warning(f"GeminiProvider health check failed: {e}")
            return False

    def _fallback_result(self, idea_data: Dict[str, Any], prompt_version: str) -> Dict[str, Any]:
        res = MockProvider().generate_validation_analysis(idea_data, prompt_version)
        res["generation_mode"] = "heuristic_fallback"
        res["degraded"] = True
        limitations = res.get("limitations", [])
        if "Report generated using heuristic fallback model because Gemini AI was unavailable." not in limitations:
            limitations.append("Report generated using heuristic fallback model because Gemini AI was unavailable.")
        res["limitations"] = limitations
        return res

    def generate_validation_analysis(self, idea_data: Dict[str, Any], prompt_version: str = "v1.2") -> Dict[str, Any]:
        if not self.health_check():
            struct_logger.warning("llm_fallback_triggered", event="llm_fallback_triggered", reason="Gemini health check failed or API key invalid", idea_id=idea_data.get("id"))
            return self._fallback_result(idea_data, prompt_version)

        try:
            import google.generativeai as genai
            genai.configure(api_key=self.api_key)
            model = genai.GenerativeModel(self.provider_name)

            prompt_template = get_prompt(prompt_version)
            formatted_prompt = prompt_template.format(
                title=idea_data.get("title", ""),
                description=idea_data.get("description", ""),
                problem=idea_data.get("problem", "Not specified"),
                target_customer=idea_data.get("target_customer", "Not specified"),
                solution=idea_data.get("solution", "Not specified"),
                industry=idea_data.get("industry", "Not specified"),
                business_model=idea_data.get("business_model", "Not specified"),
                revenue_model=idea_data.get("revenue_model", "Not specified"),
                pricing=idea_data.get("pricing", "Not specified"),
                technology=idea_data.get("technology", "Not specified")
            )

            response = model.generate_content(formatted_prompt)
            parsed = parse_llm_json(response.text)
            if parsed and "market_demand" in parsed:
                parsed["generation_mode"] = "ai_standard"
                parsed["degraded"] = False
                return parsed

            struct_logger.warning("llm_fallback_triggered", event="llm_fallback_triggered", reason="Failed to parse Gemini JSON response", idea_id=idea_data.get("id"))
            return self._fallback_result(idea_data, prompt_version)

        except Exception as e:
            struct_logger.warning("llm_fallback_triggered", event="llm_fallback_triggered", reason=str(e), idea_id=idea_data.get("id"))
            return self._fallback_result(idea_data, prompt_version)
