from typing import Generic, TypeVar, Dict, Any, Optional
from pydantic import BaseModel

T = TypeVar("T")


class SuccessResponse(BaseModel, Generic[T]):
    success: bool = True
    data: T
    meta: Dict[str, Any] = {}


class ErrorResponse(BaseModel):
    success: bool = False
    error: str          # machine-readable code e.g. "rate_limit_exceeded"
    message: str        # human-readable explanation
    details: Dict[str, Any] = {}  # field-level validation errors if applicable
