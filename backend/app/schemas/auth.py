import re
from typing import Optional
from pydantic import BaseModel, Field, field_validator

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")


class UserRegister(BaseModel):
    name: str
    email: str
    password: str
    college: Optional[str] = None
    course: Optional[str] = None
    graduationYear: Optional[int] = Field(default=None, alias="graduation_year")
    graduation_year: Optional[int] = None

    class Config:
        populate_by_name = True

    @field_validator('email')
    @classmethod
    def validate_email_format(cls, v: str) -> str:
        v = v.strip().lower()
        if not EMAIL_REGEX.match(v):
            raise ValueError("Invalid email format. Please enter a valid email (e.g. user@domain.com)")
        return v


class UserLogin(BaseModel):
    email: Optional[str] = None
    username: Optional[str] = None
    identifier: Optional[str] = None
    password: str

    def get_login_identifier(self) -> str:
        ident = self.email or self.username or self.identifier
        if not ident:
            raise ValueError("Email or username is required.")
        return ident.strip().lower()


class GoogleAuthRequest(BaseModel):
    credential: Optional[str] = None
    email: Optional[str] = None
    name: Optional[str] = None
    googleId: Optional[str] = Field(default=None, alias="google_id")
    profileImage: Optional[str] = Field(default=None, alias="profile_image")
    college: Optional[str] = None
    course: Optional[str] = None
    graduationYear: Optional[int] = Field(default=None, alias="graduation_year")

    class Config:
        populate_by_name = True


class AdminLoginRequest(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    password: str


class ForgotPasswordRequest(BaseModel):
    email: str

    @field_validator('email')
    @classmethod
    def validate_email_format(cls, v: str) -> str:
        v = v.strip().lower()
        if not EMAIL_REGEX.match(v):
            raise ValueError("Invalid email format")
        return v


class ResetPasswordRequest(BaseModel):
    token: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: str
