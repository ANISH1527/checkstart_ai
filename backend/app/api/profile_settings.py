from datetime import datetime, timedelta
from typing import Optional, Dict, Any, Union
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from jose import jwt, JWTError

from app.core.config import settings
from app.core.dependencies import get_current_user
from app.database.connection import get_db
from app.models.user import User
from app.models.profile import UserProfile, UserPreference
from app.models.idea import Idea
from app.models.chat import ValidationSession
from app.utils.hashing import verify_password, get_password_hash
from app.schemas.envelope import SuccessResponse

router = APIRouter(tags=["User Profile & Settings"])


class ProfileUpdateRequest(BaseModel):
    name: Optional[str] = None
    college: Optional[str] = None
    course: Optional[str] = None
    graduationYear: Optional[int] = Field(default=None, alias="graduation_year")
    graduation_year: Optional[int] = None

    class Config:
        populate_by_name = True


class PasswordUpdateRequest(BaseModel):
    currentPassword: Optional[str] = None
    newPassword: str


class VerifyDeleteRequest(BaseModel):
    password: Optional[str] = None
    googleEmail: Optional[str] = None
    credential: Optional[str] = None


class DeleteAccountRequest(BaseModel):
    confirmText: str
    verificationToken: str


class SettingsUpdateRequest(BaseModel):
    theme: Optional[str] = None  # "light", "dark", "system"
    emailNotifications: Optional[bool] = Field(default=None, alias="email_notifications")
    email_notifications: Optional[bool] = None

    class Config:
        populate_by_name = True


def _format_user_profile(user: User, db: Session) -> Dict[str, Any]:
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
        "createdAt": user.created_at.isoformat() if user.created_at else datetime.utcnow().isoformat(),
        "lastLoginAt": user.last_login_at.isoformat() if getattr(user, "last_login_at", None) else None,
        "_count": {
            "ideas": ideas_count,
            "conversations": convs_count
        }
    }


def _get_or_create_prefs(user_id: int, db: Session) -> UserPreference:
    pref = db.query(UserPreference).filter(UserPreference.user_id == user_id).first()
    if not pref:
        pref = UserPreference(user_id=user_id, theme="light", email_notifications=True)
        db.add(pref)
        db.commit()
        db.refresh(pref)
    return pref


# --- Profile Endpoints ---

@router.get("/user/profile")
@router.get("/profile")
def get_user_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile_data = _format_user_profile(current_user, db)
    return SuccessResponse(data={"profile": profile_data, "user": profile_data})


@router.put("/user/profile")
@router.put("/profile")
def update_user_profile(
    payload: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if payload.name:
        current_user.name = payload.name.strip()

    prof = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if not prof:
        prof = UserProfile(user_id=current_user.id)
        db.add(prof)

    if payload.college is not None:
        prof.college = payload.college.strip() if payload.college else None
    if payload.course is not None:
        prof.course = payload.course.strip() if payload.course else None

    grad_year = payload.graduationYear or payload.graduation_year
    if grad_year is not None:
        prof.graduation_year = grad_year

    db.commit()
    db.refresh(current_user)

    updated_data = _format_user_profile(current_user, db)
    return SuccessResponse(data={
        "user": updated_data,
        "profile": updated_data,
        "message": "Profile updated successfully."
    })


# --- Password & Security Endpoints ---

@router.put("/user/password")
def update_user_password(
    payload: PasswordUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not payload.newPassword or len(payload.newPassword) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 6 characters long."
        )

    if current_user.password_hash:
        if not payload.currentPassword:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is required."
            )
        if not verify_password(payload.currentPassword, current_user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect."
            )

    current_user.password_hash = get_password_hash(payload.newPassword)
    db.commit()
    return SuccessResponse(data={"message": "Password updated successfully."})


@router.post("/user/verify-delete")
def verify_delete_identity(
    payload: VerifyDeleteRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify password if user has password
    if current_user.password_hash:
        if not payload.password or not verify_password(payload.password, current_user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid password provided for verification."
            )
    else:
        # Google user
        if payload.googleEmail and payload.googleEmail.strip().lower() != current_user.email.lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Google email verification failed."
            )

    # Issue single-use 10-minute deletion token
    expire = datetime.utcnow() + timedelta(minutes=10)
    to_encode = {
        "sub": str(current_user.id),
        "purpose": "account_delete",
        "exp": expire
    }
    verification_token = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

    return SuccessResponse(data={
        "verificationToken": verification_token,
        "message": "Identity verified. You may proceed with deletion."
    })


@router.delete("/user/account")
def delete_account(
    payload: DeleteAccountRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if payload.confirmText != "DELETE":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Confirmation text must be 'DELETE' to confirm account deletion."
        )

    try:
        decoded = jwt.decode(payload.verificationToken, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if decoded.get("purpose") != "account_delete" or decoded.get("sub") != str(current_user.id):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid verification token.")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Expired or invalid verification token.")

    # Cascading delete
    db.delete(current_user)
    db.commit()

    return SuccessResponse(data={"message": "Your account and all associated data have been permanently deleted."})


# --- Settings / Preferences Endpoints ---

@router.get("/user/settings")
@router.get("/settings")
def get_user_settings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    pref = _get_or_create_prefs(current_user.id, db)
    return SuccessResponse(data={
        "settings": {
            "theme": pref.theme,
            "emailNotifications": pref.email_notifications
        }
    })


@router.put("/user/settings")
@router.put("/settings")
def update_user_settings(
    payload: SettingsUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    pref = _get_or_create_prefs(current_user.id, db)

    if payload.theme is not None:
        if payload.theme in ["light", "dark", "system"]:
            pref.theme = payload.theme

    email_notifs = payload.emailNotifications if payload.emailNotifications is not None else payload.email_notifications
    if email_notifs is not None:
        pref.email_notifications = email_notifs

    db.commit()
    db.refresh(pref)

    return SuccessResponse(data={
        "settings": {
            "theme": pref.theme,
            "emailNotifications": pref.email_notifications
        },
        "message": "Settings updated successfully."
    })
