import numpy as np
from fastapi import APIRouter, HTTPException
from app.models.schemas import BiometricInput, PredictionResponse
from app.models.inference import predict

router = APIRouter()

FEATURE_ORDER = [
    'resting_heart_rate', 'hrv_ms', 'sleep_hours', 'deep_sleep_pct',
    'rem_sleep_pct', 'steps', 'active_minutes', 'stress_score',
    'spo2_pct', 'body_temp_deviation'
]


@router.post("/predict", response_model=PredictionResponse)
async def predict_endpoint(payload: BiometricInput):
    try:
        input_dict = payload.model_dump()
        input_array = np.array([[input_dict[col] for col in FEATURE_ORDER]])
        result = predict(input_array)
        return PredictionResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")
