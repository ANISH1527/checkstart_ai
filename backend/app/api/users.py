from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.dependencies import get_current_user
from app.database.connection import get_db
from app.models.user import User
from app.schemas.user import UserResponse
from app.schemas.envelope import SuccessResponse
from app.api.profile_settings import (
    _format_user_profile,
    ProfileUpdateRequest,
    PasswordUpdateRequest,
    update_user_password as _update_password_impl
)

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me")
def read_current_user(current_user: User = Depends(get_current_user)):
    return SuccessResponse(data=UserResponse.model_validate(current_user))


@router.get("/profile")
def get_user_profile_endpoint(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile_data = _format_user_profile(current_user, db)
    return SuccessResponse(data={"profile": profile_data, "user": profile_data})


@router.put("/profile")
def update_user_profile_endpoint(
    payload: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from app.models.profile import UserProfile
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


@router.put("/password")
def update_user_password_endpoint(
    payload: PasswordUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return _update_password_impl(payload, current_user, db)

