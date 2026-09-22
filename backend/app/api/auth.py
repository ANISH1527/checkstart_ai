from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta

from app.core.config import settings
from app.core.dependencies import get_current_user
from app.core.limiter import limiter
from app.core.security import create_access_token
from app.database.connection import get_db
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.auth import UserRegister, Token
from app.schemas.user import UserResponse
from app.utils.hashing import verify_password

from app.schemas.envelope import SuccessResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", status_code=status.HTTP_201_CREATED)
@limiter.limit("3/minute")
def register(request: Request, user_in: UserRegister, db: Session = Depends(get_db)):
    user_repo = UserRepository(db)
    existing = user_repo.get_by_email(user_in.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email address is already registered."
        )
    user = user_repo.create(user_in)
    return SuccessResponse(data=UserResponse.model_validate(user))


@router.post("/login")
@limiter.limit("5/minute")
def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user_repo = UserRepository(db)
    user = user_repo.get_by_email(form_data.username)
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=str(user.id), expires_delta=access_token_expires
    )
    return SuccessResponse(data={"access_token": access_token, "token_type": "bearer"})


@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return SuccessResponse(data=UserResponse.model_validate(current_user))

