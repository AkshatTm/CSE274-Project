from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import API_V1_PREFIX, CORS_ORIGINS
from app.routes.predict import router as predict_router
from app.models.inference import load_models


@asynccontextmanager
async def lifespan(app: FastAPI):
    load_models()
    yield
    print("Shutting down BioSync API.")


app = FastAPI(
    title="BioSync API",
    description="Predictive Biometric Telemetry Engine — ML Backend",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(predict_router, prefix=API_V1_PREFIX)


@app.get(f"{API_V1_PREFIX}/health")
async def health_check():
    return {"status": "healthy", "models_loaded": True}
