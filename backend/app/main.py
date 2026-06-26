"""
FoodChain AI - Main Application

FastAPI application entry point with CORS, routers, and exception handlers.
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.exceptions import AppException
from app.api.auth import router as auth_router
from app.api.profile import router as profile_router
from app.api.suppliers import router as suppliers_router
from app.api.products import router as products_router
from app.api.ingredients import router as ingredients_router
from app.api.recommendation import router as recommendation_router
from app.utils.logger import logger

# ============================================
# Create FastAPI Application
# ============================================
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-powered procurement platform for street food vendors",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ============================================
# CORS Middleware
# ============================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+|frontend|.*\.vercel\.app)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# Register Routers
# ============================================
app.include_router(auth_router)
app.include_router(profile_router)
app.include_router(suppliers_router)
app.include_router(products_router)
app.include_router(ingredients_router)
app.include_router(recommendation_router)

# ============================================
# Exception Handlers
# ============================================


@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    """Handle all custom application exceptions."""
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    """Handle unexpected exceptions."""
    logger.error(f"Unexpected error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )


# ============================================
# Health Check
# ============================================


@app.get("/", tags=["Health"])
def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
    }


@app.get("/health", tags=["Health"])
def health():
    """Detailed health check."""
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
    }


# ============================================
# Startup Event
# ============================================


@app.on_event("startup")
async def startup_event():
    """Application startup tasks."""
    logger.info(f"🚀 {settings.APP_NAME} v{settings.APP_VERSION} starting up...")
    logger.info(f"📄 API docs available at /docs")
