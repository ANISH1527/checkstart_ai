from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded

from app.core.config import settings
from app.core.logging import setup_logging, logger
from app.core.limiter import limiter
from app.database.base import Base
from app.database.connection import engine

# Import API Routers
from app.api import auth, users, ideas, validation, history, reports, admin

from contextlib import asynccontextmanager
from sqlalchemy import text
import redis

# Setup logging configuration
setup_logging()

# Create DB tables if SQLite / simple dev run
Base.metadata.create_all(bind=engine)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting app: ENVIRONMENT={settings.ENVIRONMENT}, LLM_PROVIDER={settings.LLM_PROVIDER}")

    db_ok = False
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        db_ok = True
        logger.info("Startup DB check (SELECT 1) succeeded.")
    except Exception as e:
        logger.error(f"Startup DB check failed: {e}")

    redis_ok = True
    if getattr(settings, "REDIS_URL", None):
        try:
            r = redis.Redis.from_url(settings.REDIS_URL, socket_timeout=2)
            r.ping()
            logger.info("Startup Redis PING check succeeded.")
        except Exception as e:
            redis_ok = False
            logger.warning(f"Startup Redis check failed: {e}")

    if settings.is_production and (not db_ok or not redis_ok):
        raise RuntimeError(f"Startup health check failed in production. DB OK: {db_ok}, Redis OK: {redis_ok}")

    yield


app = FastAPI(
    title=settings.APP_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    description="AI-Assisted Startup Idea Validation and Recommendation System API Backend",
    lifespan=lifespan
)

app.state.limiter = limiter



from fastapi.exceptions import RequestValidationError, HTTPException
from app.schemas.envelope import ErrorResponse, SuccessResponse
from app.core.logging import struct_logger


@app.exception_handler(RateLimitExceeded)
async def custom_rate_limit_handler(request: Request, exc: RateLimitExceeded):
    retry_after = getattr(exc, "retry_after", 60)
    return JSONResponse(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        content=ErrorResponse(
            success=False,
            error="rate_limit_exceeded",
            message="Too many requests",
            details={"retry_after_seconds": retry_after}
        ).model_dump(),
        headers={"Retry-After": str(retry_after)}
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    details = {}
    for err in exc.errors():
        field_path = ".".join(str(loc) for loc in err.get("loc", []) if loc != "body")
        details[field_path or "non_field"] = err.get("msg", "Invalid input")

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=ErrorResponse(
            success=False,
            error="validation_error",
            message="Validation error",
            details=details
        ).model_dump()
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    code_map = {
        400: "bad_request",
        401: "unauthorized",
        403: "forbidden",
        404: "not_found",
        422: "validation_error",
        429: "rate_limit_exceeded",
        500: "internal_error"
    }
    err_code = code_map.get(exc.status_code, "error")
    msg = exc.detail if isinstance(exc.detail, str) else "Request error"
    
    if exc.status_code == 401:
        if not msg or msg.lower() in ("unauthorized", "could not validate credentials", "not authenticated"):
            msg = "Invalid or expired token"
    elif exc.status_code == 403:
        if not msg or msg.lower() in ("forbidden", ""):
            msg = "Insufficient permissions"
    elif exc.status_code == 404 and (msg == "Not Found" or not msg):
        msg = "Resource not found"

    headers = getattr(exc, "headers", None)
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(
            success=False,
            error=err_code,
            message=msg,
            details=exc.detail if isinstance(exc.detail, dict) else {}
        ).model_dump(),
        headers=headers
    )


# Configure CORS for React/Next.js frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["Health"])
def health_check():
    from sqlalchemy import text
    from app.database.connection import engine
    db_status = "ok"
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception:
        db_status = "error"

    redis_status = "ok"
    try:
        import redis
        r = redis.Redis.from_url(getattr(settings, "REDIS_URL", "redis://localhost:6379/0"), socket_timeout=1)
        r.ping()
    except Exception:
        redis_status = "error"

    llm_status = "reachable"
    try:
        from app.services.llm_service import get_llm_service
        llm = get_llm_service()
        if hasattr(llm, "health_check") and not llm.health_check():
            llm_status = "unreachable"
    except Exception:
        llm_status = "unreachable"

    overall = "ok" if db_status == "ok" else "error"
    return SuccessResponse(data={
        "status": overall,
        "db": db_status,
        "redis": redis_status,
        "llm_api": llm_status
    })


# Global Structured Error Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    if isinstance(exc, RateLimitExceeded):
        return await custom_rate_limit_handler(request, exc)
    if isinstance(exc, HTTPException):
        return await http_exception_handler(request, exc)

    struct_logger.error("unhandled_exception", url=str(request.url), error=str(exc), exc_info=True)

    details = {}
    if not settings.is_production:
        details = {"type": type(exc).__name__, "detail": str(exc)}

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=ErrorResponse(
            success=False,
            error="internal_error",
            message="An unexpected error occurred",
            details=details
        ).model_dump()
    )



# Import API Routers
from app.api import (
    auth,
    users,
    ideas,
    validation,
    history,
    reports,
    admin,
    sessions,
    dashboard,
    comparisons,
    profile_settings
)

# Include Routers with API Version Prefix (/api/v1) and legacy/frontend proxy prefix (/api)
all_routers = [
    auth.router,
    users.router,
    ideas.router,
    validation.router,
    history.router,
    reports.router,
    admin.router,
    sessions.router,
    dashboard.router,
    comparisons.router,
    profile_settings.router
]

for r in all_routers:
    app.include_router(r, prefix=settings.API_V1_STR)
    if settings.API_V1_STR != "/api":
        app.include_router(r, prefix="/api")

