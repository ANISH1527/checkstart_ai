import re
from typing import Optional
from pydantic import BaseModel, Field, field_validator, ConfigDict

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")


class UserRegister(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    name: str
    email: str
    password: str
    college: Optional[str] = None
    course: Optional[str] = None
    graduationYear: Optional[int] = Field(default=None, validation_alias="graduation_year")
    graduation_year: Optional[int] = None

    @field_validator('email')
    @classmethod
    def validate_email_format(cls, v: str) -> str:
        v = v.strip().lower()
        if not EMAIL_REGEX.match(v):
            raise ValueError("Invalid email format. Please enter a valid email (e.g. user@domain.com)")
        return v


class UserLogin(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    email: Optional[str] = None
    username: Optional[str] = None
    identifier: Optional[str] = None
    password: str

    def get_login_identifier(self) -> str:
        ident = self.email or self.username or self.identifier
        if not ident or not ident.strip():
            raise ValueError("Email or username is required.")
        return ident.strip().lower()


class GoogleAuthRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    credential: str = Field(..., description="Signed Google ID token (JWT) from Google Identity Services")
    college: Optional[str] = None
    course: Optional[str] = None
    graduationYear: Optional[int] = Field(default=None, validation_alias="graduation_year")
    graduation_year: Optional[int] = None

    @field_validator('credential')
    @classmethod
    def validate_credential_non_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Google ID token credential must not be empty.")
        return v.strip()


class AdminLoginRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    username: Optional[str] = None
    email: Optional[str] = None
    password: str


class ForgotPasswordRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    email: str

    @field_validator('email')
    @classmethod
    def validate_email_format(cls, v: str) -> str:
        v = v.strip().lower()
        if not EMAIL_REGEX.match(v):
            raise ValueError("Invalid email format")
        return v


class ResetPasswordRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    token: str
    password: str


class Token(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    user_id: str
