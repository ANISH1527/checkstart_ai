from typing import Dict, Any, Optional
from app.core.config import settings
from app.core.logging import logger, struct_logger
from app.prompts.prompt_versions import get_prompt
from app.utils.json_utils import parse_llm_json
from app.services.llm_providers.base import LLMProvider
from app.services.llm_providers.mock_provider import MockProvider


import hashlib
import random
import time
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FuturesTimeoutError
from typing import Dict, Any, Optional
from app.core.config import settings
from app.core.logging import logger, struct_logger
from app.prompts.prompt_versions import get_prompt
from app.utils.json_utils import parse_llm_json
from app.services.llm_providers.base import LLMProvider
from app.services.llm_providers.mock_provider import MockProvider

LLM_TIMEOUT_SECONDS = 12


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
            res = model.generate_content("ping", generation_config={"max_output_tokens": 1})
            return bool(res and res.text)
        except Exception as e:
            logger.warning(f"GeminiProvider health check failed: {e}")
            return False

    def _deterministic_offline_fallback(self, idea_data: Dict[str, Any], prompt_version: str) -> Dict[str, Any]:
        """
        Deterministic reproducible fallback seeded by MD5 hash of idea text.
        Flagged as 'offline estimate, not market validation' with confidence penalty.
        """
        idea_text = f"{idea_data.get('title', '')} {idea_data.get('description', '')}".strip()
        md5_hash = hashlib.md5(idea_text.encode("utf-8")).hexdigest()
        seed_val = int(md5_hash[:8], 16)
        rng = random.Random(seed_val)

        # Generate reproducible 1.0-10.0 scores
        scores = {
            "market_demand": round(rng.uniform(5.5, 7.5), 1),
            "problem_severity": round(rng.uniform(5.0, 7.5), 1),
            "competition": round(rng.uniform(4.5, 7.0), 1),
            "target_customer": round(rng.uniform(5.0, 7.5), 1),
            "innovation": round(rng.uniform(5.0, 7.0), 1),
            "feasibility": round(rng.uniform(6.0, 8.0), 1),
            "revenue_potential": round(rng.uniform(4.5, 7.0), 1),
        }

        fallback_flag = "offline estimate, not market validation"
        return {
            "generation_mode": "offline_fallback",
            "degraded": True,
            "fallback_flag": fallback_flag,
            "scores": scores,
            "confidence_penalty": 25.0,
            "summary": f"[OFFLINE ESTIMATE, NOT MARKET VALIDATION] Heuristic analysis generated offline for {idea_data.get('title', 'Idea')}.",
            "strategic_verdict": "Offline heuristic assessment. Empirical customer validation required before capital commitment.",
            "recommended_action": "Conduct in-person customer discovery interviews to validate problem assumptions.",
            "strengths": [
                f"Addresses identified operational friction for {idea_data.get('target_customer') or 'target users'}",
                "Concept leverages straightforward technical implementation"
            ],
            "weaknesses": [
                "Offline estimate, not market validation: Unverified primary willingness to pay",
                "Customer acquisition channels require empirical testing"
            ],
            "risks": [
                {"category": "MARKET", "severity": "HIGH", "mitigation": "Conduct 15 target customer discovery interviews"},
                {"category": "EXECUTION", "severity": "MEDIUM", "mitigation": "Build initial non-code prototype or landing page"}
            ],
            "claims": [
                {"claim": f"Founder proposes {idea_data.get('title', 'venture')} to address campus/student needs.", "category": "GENERAL"},
                {"claim": "Market demand is estimated through offline baseline heuristics.", "category": "MARKET"}
            ],
            "limitations": [fallback_flag],
            "prompt_version": prompt_version
        }

    def _call_gemini_raw(self, formatted_prompt: str) -> str:
        import google.generativeai as genai
        genai.configure(api_key=self.api_key)
        model = genai.GenerativeModel(self.provider_name)
        response = model.generate_content(formatted_prompt)
        return response.text if response else ""

    def generate_validation_analysis(self, idea_data: Dict[str, Any], prompt_version: str = "v1.2") -> Dict[str, Any]:
        # If API key is missing or invalid, immediately use deterministic offline fallback
        if not self.api_key or self.api_key.strip() in ["", "none", "n/a", "mock"]:
            return self._deterministic_offline_fallback(idea_data, prompt_version)

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

        # 12-second timeout with 1 retry on failure
        max_attempts = 2
        for attempt in range(1, max_attempts + 1):
            try:
                with ThreadPoolExecutor(max_workers=1) as executor:
                    future = executor.submit(self._call_gemini_raw, formatted_prompt)
                    raw_text = future.result(timeout=LLM_TIMEOUT_SECONDS)

                parsed = parse_llm_json(raw_text)
                if parsed and ("market_demand" in parsed or "scores" in parsed or "parameters" in parsed):
                    parsed["generation_mode"] = "ai_standard"
                    parsed["degraded"] = False
                    return parsed

                logger.warning(f"Gemini response parsing failed on attempt {attempt}")
            except FuturesTimeoutError:
                struct_logger.warning(
                    "llm_timeout_occurred",
                    attempt=attempt,
                    timeout=LLM_TIMEOUT_SECONDS,
                    idea_id=idea_data.get("id")
                )
            except Exception as e:
                struct_logger.warning(
                    "llm_call_failed",
                    attempt=attempt,
                    error=str(e),
                    idea_id=idea_data.get("id")
                )

            if attempt < max_attempts:
                time.sleep(0.5)

        # If all attempts fail, use deterministic fallback
        struct_logger.warning(
            "llm_fallback_triggered",
            reason="Gemini call timed out or failed after retry; applying offline fallback",
            idea_id=idea_data.get("id")
        )
        return self._deterministic_offline_fallback(idea_data, prompt_version)
