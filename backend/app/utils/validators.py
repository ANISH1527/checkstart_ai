import hashlib
import re


def compute_sha256(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def detect_prompt_injection(text: str) -> bool:
    patterns = [
        r"ignore previous instructions",
        r"disregard system prompt",
        r"you are now DAN",
        r"bypass security",
        r"system override"
    ]
    for pattern in patterns:
        if re.search(pattern, text, re.IGNORECASE):
            return True
    return False
