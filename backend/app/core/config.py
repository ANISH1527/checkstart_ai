from typing import Optional
from pydantic import computed_field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./startup_validation.db"
    TEST_DATABASE_URL: str = "sqlite:///./test.db"
    REDIS_URL: str = "redis://localhost:6379/0"
    LLM_PROVIDER: str = "mock"
    GEMINI_API_KEY: Optional[str] = None
    JWT_SECRET_KEY: str = "default-insecure-secret-key-change-me-1234567890"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"

    APP_NAME: str = "AI Startup Idea Validation API"
    DEBUG: bool = True
    API_V1_STR: str = "/api/v1"
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3"
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    SIMILARITY_THRESHOLD: float = 0.85

    @property
    def SECRET_KEY(self) -> str:
        return self.JWT_SECRET_KEY

    @computed_field
    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT.lower() == "production"

    @model_validator(mode="after")
    def validate_production_llm(self):
        if self.is_production and self.LLM_PROVIDER.lower() == "mock":
            raise ValueError("Mock LLM not allowed in production")
        return self

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()

