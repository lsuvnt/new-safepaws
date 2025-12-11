# app/main.py
import os
from pathlib import Path
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from app.db.session import ping_db
from app.api.pins import router as pins_router
from app.api.users import router as users_router
from app.api.cat import router as cat_router
from app.api.adoptions import router as adoptions_router
from app.api.adoptionsRequest import router as adoptionsRequest_router
from app.api.notifications import router as notifications_router
from app.api.activity import router as activity_router
from dotenv import load_dotenv

# Load .env from the app folder
env_path = Path(__file__).parent / '.env'
load_dotenv(dotenv_path=env_path)

app = FastAPI(title="Safepaws API", version="1.0.0")

# CORS configuration - allows frontend to make requests
# Get allowed origins from environment variable, or use default for development
allowed_origins = os.getenv(
    "CORS_ORIGINS", 
    "http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins='*',
    allow_credentials=True,
    allow_methods=["*"],  # Allows all HTTP methods (GET, POST, DELETE, etc.)
    allow_headers=["*"],  # Allows all headers
)

# Exception handler to ensure CORS headers are included in error responses
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # Get origin from request or use default
    origin = request.headers.get("origin")
    if origin and origin in allowed_origins:
        cors_origin = origin
    elif allowed_origins:
        cors_origin = allowed_origins[0]
    else:
        cors_origin = "*"
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": str(exc)},
        headers={
            "Access-Control-Allow-Origin": cors_origin,
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Credentials": "true",
        }
    )

@app.get("/")
def root():
    return {"message": "Safepaws backend is running successfully!"}

@app.get("/healthz")
def healthz():
    ping_db()  
    return {"ok": True}

app.include_router(users_router)
app.include_router(pins_router)
app.include_router(cat_router)
app.include_router(adoptions_router)
app.include_router(adoptionsRequest_router)
app.include_router(notifications_router)
app.include_router(activity_router)