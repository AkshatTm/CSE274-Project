from pydantic import BaseModel, Field
from typing import Optional


class BiometricInput(BaseModel):
    resting_heart_rate: float = Field(ge=30, le=220, description="Resting heart rate in bpm")
    hrv_ms: float = Field(ge=0, le=300, description="Heart rate variability in ms")
    sleep_hours: float = Field(ge=0, le=24, description="Total sleep hours")
    deep_sleep_pct: float = Field(ge=0, le=100, description="Deep sleep percentage")
    rem_sleep_pct: float = Field(ge=0, le=100, description="REM sleep percentage")
    steps: float = Field(ge=0, le=100000, description="Daily step count")
    active_minutes: float = Field(ge=0, le=1440, description="Active exercise minutes")
    stress_score: float = Field(ge=0, le=100, description="Stress score")
    spo2_pct: float = Field(ge=80, le=100, description="Blood oxygen saturation %")
    body_temp_deviation: float = Field(ge=-5.0, le=5.0, description="Body temp deviation from baseline °C")

    model_config = {
        "json_schema_extra": {
            "example": {
                "resting_heart_rate": 62,
                "hrv_ms": 48,
                "sleep_hours": 6.5,
                "deep_sleep_pct": 18.0,
                "rem_sleep_pct": 22.0,
                "steps": 9200,
                "active_minutes": 45,
                "stress_score": 55,
                "spo2_pct": 97.0,
                "body_temp_deviation": 0.1,
            }
        }
    }


class PipelineMetrics(BaseModel):
    roc_auc: float
    rmse: float
    r2: float
    mae: float
    silhouette_score: float
    davies_bouldin_index: float


class PredictionResponse(BaseModel):
    readiness_classification_state: str
    readiness_score: float
    predicted_expenditure_value: float
    assigned_biometric_cluster: int
    cluster_label: str
    pipeline_validation_metrics: PipelineMetrics
