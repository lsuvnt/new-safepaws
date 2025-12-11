# app/main.py
from fastapi import FastAPI
from app.api.pins import router as pins_router

app = FastAPI(title="Safepaws API")

@app.get("/")
def root():
    return {"message": "MAIN: Safepaws backend is running"}

app.include_router(pins_router)