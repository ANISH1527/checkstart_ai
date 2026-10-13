from typing import Dict, Any, Optional
from app.core.config import settings
from app.services.llm_providers import LLMProvider, GeminiProvider, MockProvider

PROMPT_VERSION = "v1.3"
LLM_PROMPT_VERSION = "v1.3"


def get_llm_service(provider_override: Optional[str] = None) -> LLMProvider:
    provider = (provider_override or getattr(settings, "LLM_PROVIDER", "gemini")).lower()
    if provider == "gemini":
        gemini_provider = GeminiProvider()
        if not gemini_provider.health_check():
            return MockProvider()
        return gemini_provider
    return MockProvider()
