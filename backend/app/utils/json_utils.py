import json
import re
from typing import Any, Dict, Optional


def clean_json_string(text: str) -> str:
    # Strip markdown codeblocks ```json ... ```
    cleaned = text.strip()
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", cleaned)
    if match:
        return match.group(1).strip()
    return cleaned


def parse_llm_json(text: str) -> Optional[Dict[str, Any]]:
    try:
        cleaned = clean_json_string(text)
        return json.loads(cleaned)
    except Exception:
        # Fallback regex search for brace structure
        try:
            match = re.search(r"\{[\s\S]*\}", text)
            if match:
                return json.loads(match.group(0))
        except Exception:
            pass
        return None
