from abc import ABC, abstractmethod
from typing import Dict, Any


class LLMProvider(ABC):
    @abstractmethod
    def generate_validation_analysis(self, idea_data: Dict[str, Any], prompt_version: str = "v1.2") -> Dict[str, Any]:
        pass

    @property
    @abstractmethod
    def provider_name(self) -> str:
        pass

    @property
    def model_name(self) -> str:
        return self.provider_name

    @property
    def model_version(self) -> str:
        return "1.0"

    @abstractmethod
    def health_check(self) -> bool:
        pass
