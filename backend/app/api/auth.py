import os
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from jose import jwt, JWTError

from app.core.config import settings
from app.core.dependencies import get_current_user
from app.core.limiter import limiter
from app.core.security import create_access_token
from app.database.connection import get_db
from app.models.user import User
from app.models.profile import UserProfile, UserPreference
from app.models.idea import Idea
from app.models.chat import ValidationSession
from app.repositories.user_repository import UserRepository
from app.schemas.auth import (
    UserRegister,
    UserLogin,
    GoogleAuthRequest,
    AdminLoginRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest
)
from app.schemas.user import UserResponse
from app.utils.hashing import verify_password, get_password_hash, hash_password
from app.schemas.envelope import SuccessResponse
from app.core.logging import logger

router = APIRouter(prefix="/auth", tags=["Authentication"])


def _user_to_response_dict(user: User, db: Session) -> Dict[str, Any]:
    prof = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
    ideas_count = db.query(Idea).filter(Idea.user_id == user.id, Idea.is_deleted == False).count()
    convs_count = db.query(ValidationSession).filter(ValidationSession.user_id == user.id, ValidationSession.is_deleted == False).count()

    return {
        "id": str(user.id),
        "name": user.name,
        "email": user.email,
        "role": getattr(user, "role", "USER"),
        "authProvider": getattr(user, "auth_provider", "LOCAL"),
        "profileImage": getattr(user, "profile_image", None),
        "college": prof.college if prof else None,
        "course": prof.course if prof else None,
        "graduationYear": prof.graduation_year if prof else None,
        "createdAt": user.created_at.isoformat() if user.created_at else None,
        "lastLoginAt": user.last_login_at.isoformat() if getattr(user, "last_login_at", None) else None,
        "_count": {
            "ideas": ideas_count,
            "conversations": convs_count
        }
    }


@router.post("/register", status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
def register(request: Request, user_in: UserRegister, db: Session = Depends(get_db)):
    user_repo = UserRepository(db)
    existing = user_repo.get_by_email(user_in.email)
    if existing:
        if getattr(existing, "auth_provider", "LOCAL") == "GOOGLE":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This email address is registered via Google Sign-In. Please sign in using Continue with Google."
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email address is already registered."
        )

    user = user_repo.create(user_in)

    # Attach profile if provided
    grad_year = getattr(user_in, "graduationYear", None) or getattr(user_in, "graduation_year", None)
    if user_in.college or user_in.course or grad_year:
        prof = UserProfile(
            user_id=user.id,
            college=user_in.college,
            course=user_in.course,
            graduation_year=grad_year
        )
        db.add(prof)

    # Default preferences
    pref = UserPreference(user_id=user.id, theme="light", email_notifications=True)
    db.add(pref)
    db.commit()
    db.refresh(user)

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=str(user.id), expires_delta=access_token_expires
    )

    user_data = _user_to_response_dict(user, db)

    return SuccessResponse(data={
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "role": user.role,
        "token": access_token,
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_data,
        "message": "Account created successfully."
    })


@router.post("/login")
@limiter.limit("5/minute")
async def login(request: Request, db: Session = Depends(get_db)):

    # Support both JSON payload and OAuth2 form data
    content_type = request.headers.get("content-type", "")
    username = None
    password = None

    if "application/json" in content_type:
        try:
            body = await request.json()
            username = body.get("email") or body.get("username") or body.get("identifier")
            password = body.get("password")
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid JSON payload."
            )
    else:
        # Form-data or x-www-form-urlencoded
        form = await request.form()
        username = form.get("username") or form.get("email") or form.get("identifier")
        password = form.get("password")

    if not username or not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username/email and password are required."
        )

    user_repo = UserRepository(db)
    user = user_repo.get_by_email_or_name(username.strip())

    # Check if this user registered via Google Sign-In and lacks a password
    if user and getattr(user, "auth_provider", "LOCAL") == "GOOGLE" and not user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="This account was created with Google Sign-In. Please sign in using Continue with Google.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user or not user.password_hash or not verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user.last_login_at = datetime.utcnow()
    db.commit()

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=str(user.id), expires_delta=access_token_expires
    )
    user_data = _user_to_response_dict(user, db)

    return SuccessResponse(data={
        "access_token": access_token,
        "token": access_token,
        "token_type": "bearer",
        "user": user_data,
        "message": "Login successful."
    })


@router.post("/google")
def google_auth(payload: GoogleAuthRequest, db: Session = Depends(get_db)):
    if not payload.credential or not payload.credential.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google ID token credential is required for authentication."
        )

    raw_token = payload.credential.strip()

    # In testing mode with a mocked valid token
    if (
        os.environ.get("TESTING") == "1"
        and raw_token.startswith("mock_valid_google_token_")
    ):
        mock_email = raw_token[len("mock_valid_google_token_"):].strip()
        if not mock_email or "@" not in mock_email:
            mock_email = "test.google.user@example.com"
        id_info = {
            "sub": f"google_sub_{mock_email}",
            "email": mock_email,
            "name": mock_email.split("@")[0].title(),
            "picture": "https://lh3.googleusercontent.com/sample",
            "iss": "https://accounts.google.com"
        }
    else:
        # Full cryptographic verification against Google OAuth2 public certificates
        try:
            from google.oauth2 import id_token
            from google.auth.transport import requests as google_requests

            audience = (
                getattr(settings, "GOOGLE_CLIENT_ID", None)
                or "659981468656-7rb8trd9vbuijaqncul1lmb46f0iulb6.apps.googleusercontent.com"
            )
            id_info = id_token.verify_oauth2_token(
                raw_token,
                google_requests.Request(),
                audience=audience
            )
        except ValueError as ve:
            logger.warning(f"Google ID token verification failed: {ve}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Google ID token signature verification failed: {ve}"
            )
        except Exception as e:
            logger.error(f"Google verification network/internal failure: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Google token verification failed. Please try again."
            )

        # Enforce valid Google issuer
        issuer = id_info.get("iss")
        if issuer not in ("accounts.google.com", "https://accounts.google.com"):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid Google token issuer: {issuer}"
            )

    extracted_email = id_info.get("email")
    extracted_sub = id_info.get("sub")
    extracted_name = id_info.get("name")
    extracted_image = id_info.get("picture")

    if not extracted_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email could not be determined from Google token."
        )

    extracted_email = extracted_email.strip().lower()
    if not extracted_sub:
        extracted_sub = f"google_{extracted_email}"
    if not extracted_name:
        extracted_name = extracted_email.split("@")[0]

    # Look up user by google_sub or email
    user = db.query(User).filter((User.google_sub == extracted_sub) | (User.email == extracted_email)).first()

    if not user:
        user = User(
            name=extracted_name,
            email=extracted_email,
            password_hash=None,
            role="USER",
            auth_provider="GOOGLE",
            google_sub=extracted_sub,
            profile_image=extracted_image,
            last_login_at=datetime.utcnow()
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        # Profile
        grad_year = payload.graduationYear or getattr(payload, "graduation_year", None)
        if payload.college or payload.course or grad_year:
            prof = UserProfile(
                user_id=user.id,
                college=payload.college,
                course=payload.course,
                graduation_year=grad_year
            )
            db.add(prof)

        # Preferences
        pref = UserPreference(user_id=user.id, theme="light", email_notifications=True)
        db.add(pref)
        db.commit()
    else:
        if not user.google_sub:
            user.google_sub = extracted_sub
        if extracted_image and not user.profile_image:
            user.profile_image = extracted_image
        user.last_login_at = datetime.utcnow()
        db.commit()
        db.refresh(user)

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=str(user.id), expires_delta=access_token_expires
    )
    user_data = _user_to_response_dict(user, db)

    return SuccessResponse(data={
        "access_token": access_token,
        "token": access_token,
        "token_type": "bearer",
        "user": user_data,
        "message": "Google authentication successful."
    })


@router.post("/admin/login")
def admin_login(payload: AdminLoginRequest, db: Session = Depends(get_db)):
    ident = payload.email or payload.username
    if not ident or not payload.password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admin email/username and password are required."
        )

    user_repo = UserRepository(db)
    user = user_repo.get_by_email_or_name(ident.strip())
    if not user or not user.password_hash or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect admin credentials."
        )

    if getattr(user, "role", "USER") != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted. Administrator privileges required."
        )

    user.last_login_at = datetime.utcnow()
    db.commit()

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=str(user.id), expires_delta=access_token_expires
    )
    user_data = _user_to_response_dict(user, db)

    return SuccessResponse(data={
        "access_token": access_token,
        "token": access_token,
        "token_type": "bearer",
        "user": user_data,
        "message": "Admin login successful."
    })


@router.get("/me")
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user_data = _user_to_response_dict(current_user, db)
    return SuccessResponse(data={
        **user_data,
        "user": user_data
    })


@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    dev_token = None

    if user:
        expire = datetime.utcnow() + timedelta(minutes=15)
        dev_token = jwt.encode(
            {"sub": str(user.id), "purpose": "password_reset", "exp": expire},
            settings.SECRET_KEY,
            algorithm=settings.ALGORITHM
        )

    return SuccessResponse(data={
        "message": "If this email is registered, password reset instructions have been generated.",
        "devToken": dev_token
    })


@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    if not payload.password or len(payload.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 6 characters long."
        )

    try:
        decoded = jwt.decode(payload.token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if decoded.get("purpose") != "password_reset":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid reset token.")
        user_id = int(decoded.get("sub"))
    except (JWTError, ValueError, TypeError):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired reset token.")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    user.password_hash = get_password_hash(payload.password)
    db.commit()

    return SuccessResponse(data={"message": "Password reset successfully. You can now log in."})
