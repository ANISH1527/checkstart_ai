from app.prompts.validation_prompt import VALIDATION_PROMPT_V1

PROMPT_VERSIONS = {
    "v1": VALIDATION_PROMPT_V1,
}

DEFAULT_PROMPT_VERSION = "v1"


def get_prompt(version: str = DEFAULT_PROMPT_VERSION) -> str:
    return PROMPT_VERSIONS.get(version, VALIDATION_PROMPT_V1)
