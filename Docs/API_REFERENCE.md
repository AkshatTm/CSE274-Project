# API Reference

**BioSync REST API** — FastAPI 0.133 · Python 3.13+ · OpenAPI 3.1

For an interactive exploration, start the backend and visit **`http://localhost:8000/docs`** (Swagger UI) or **`http://localhost:8000/redoc`** (ReDoc).

---

## Base URL

| Environment | Base URL |
|---|---|
| Local Development | `http://localhost:8000` |
| Docker | `http://localhost:8000` |

---

## Authentication

This API does not require authentication in the current version. All endpoints are publicly accessible within the local network.

---

## Endpoints

### `POST /api/v1/predict`

Runs a biometric snapshot through the full ML pipeline — preprocessing → classification → regression → clustering — and returns all three predictions in a single response.

#### Request

**Content-Type:** `application/json`

| Field | Type | Required | Range | Description |
|---|---|---|---|---|
| `resting_heart_rate` | `float` | ✅ | 30 – 220 | Resting HR in beats-per-minute |
| `hrv_ms` | `float` | ✅ | 0 – 300 | Heart Rate Variability in milliseconds (RMSSD) |
| `sleep_hours` | `float` | ✅ | 0 – 24 | Total sleep duration in hours |
| `deep_sleep_pct` | `float` | ✅ | 0 – 100 | Percentage of sleep spent in deep (N3) stage |
| `rem_sleep_pct` | `float` | ✅ | 0 – 100 | Percentage of sleep spent in REM stage |
| `steps` | `float` | ✅ | 0 – 100,000 | Total daily step count |
| `active_minutes` | `float` | ✅ | 0 – 1440 | Minutes of active exercise |
| `stress_score` | `float` | ✅ | 0 – 100 | Perceived / device-derived stress score |
| `spo2_pct` | `float` | ✅ | 80 – 100 | Blood oxygen saturation percentage (SpO₂) |
| `body_temp_deviation` | `float` | ✅ | -5.0 – 5.0 | Deviation from baseline body temperature in °C |

**Example Request Body:**

```json
{
  "resting_heart_rate": 62,
  "hrv_ms": 48,
  "sleep_hours": 6.5,
  "deep_sleep_pct": 18.0,
  "rem_sleep_pct": 22.0,
  "steps": 9200,
  "active_minutes": 45,
  "stress_score": 55,
  "spo2_pct": 97.0,
  "body_temp_deviation": 0.1
}
```

#### Response

**Content-Type:** `application/json`  
**Status:** `200 OK`

| Field | Type | Description |
|---|---|---|
| `readiness_classification_state` | `string` | One of: `"Optimal Readiness"`, `"Moderate Strain"`, `"High Risk of Burnout"` |
| `readiness_score` | `float` | Confidence score 0–100 (max class probability × 100) |
| `predicted_expenditure_value` | `float` | Predicted active calorie expenditure in kcal |
| `assigned_biometric_cluster` | `integer` | Zero-based cluster ID |
| `cluster_label` | `string` | Auto-assigned human label: `"Well Recovered"`, `"Active Performer"`, or `"High Strain"` |
| `pipeline_validation_metrics` | `object` | Training metrics (see sub-table below) |

**`pipeline_validation_metrics` Object:**

| Field | Type | Description |
|---|---|---|
| `roc_auc` | `float` | Weighted OVR ROC-AUC of the classifier |
| `rmse` | `float` | RMSE of the regressor in kcal |
| `r2` | `float` | Coefficient of determination (R²) of the regressor |
| `mae` | `float` | Mean Absolute Error of the regressor in kcal |
| `silhouette_score` | `float` | Silhouette Score of the K-Means clusterer |
| `davies_bouldin_index` | `float` | Davies-Bouldin Index of the K-Means clusterer |

**Example Response:**

```json
{
  "readiness_classification_state": "Optimal Readiness",
  "readiness_score": 87.4,
  "predicted_expenditure_value": 2450.3,
  "assigned_biometric_cluster": 2,
  "cluster_label": "Well Recovered",
  "pipeline_validation_metrics": {
    "roc_auc": 0.92,
    "rmse": 55.32,
    "r2": 0.91,
    "mae": 38.7,
    "silhouette_score": 0.62,
    "davies_bouldin_index": 0.78
  }
}
```

#### cURL Example

```bash
curl -X POST "http://localhost:8000/api/v1/predict" \
  -H "Content-Type: application/json" \
  -d '{
    "resting_heart_rate": 62,
    "hrv_ms": 48,
    "sleep_hours": 6.5,
    "deep_sleep_pct": 18.0,
    "rem_sleep_pct": 22.0,
    "steps": 9200,
    "active_minutes": 45,
    "stress_score": 55,
    "spo2_pct": 97.0,
    "body_temp_deviation": 0.1
  }'
```

#### JavaScript / Fetch Example

```javascript
const response = await fetch('http://localhost:8000/api/v1/predict', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    resting_heart_rate: 62,
    hrv_ms: 48,
    sleep_hours: 6.5,
    deep_sleep_pct: 18.0,
    rem_sleep_pct: 22.0,
    steps: 9200,
    active_minutes: 45,
    stress_score: 55,
    spo2_pct: 97.0,
    body_temp_deviation: 0.1,
  }),
});

const data = await response.json();
console.log(data.readiness_classification_state); // "Optimal Readiness"
```

#### Python Example

```python
import httpx

payload = {
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

with httpx.Client() as client:
    response = client.post("http://localhost:8000/api/v1/predict", json=payload)
    print(response.json())
```

---

### `GET /api/v1/health`

Health-check endpoint. Verifies that the API is running and all ML models are loaded into memory.

#### Response

**Status:** `200 OK`

```json
{
  "status": "healthy",
  "models_loaded": true
}
```

**Status:** `503 Service Unavailable` (if models failed to load)

```json
{
  "status": "unhealthy",
  "models_loaded": false
}
```

---

## Error Responses

### `422 Unprocessable Entity`

Returned when the request body fails Pydantic field validation (e.g., value out of range, missing field).

```json
{
  "detail": [
    {
      "type": "less_than_equal",
      "loc": ["body", "resting_heart_rate"],
      "msg": "Input should be less than or equal to 220",
      "input": 999,
      "ctx": { "le": 220 }
    }
  ]
}
```

### `500 Internal Server Error`

Returned if an unexpected inference error occurs. Check that all `.pkl` model artifacts exist in `backend/ml/artifacts/`.

---

## Data Flow

```
Client Request (JSON)
      │
      ▼
Pydantic Validation (BiometricInput)
      │
      ▼
NumPy Array → preprocessing_pipeline.transform()
      │  ├── SimpleImputer (median)
      │  ├── StandardScaler
      │  ├── VarianceThreshold (0.01)
      │  └── PCA (95% variance retained)
      │
      ▼
┌─────┬──────────────┬──────────────────┐
│     │              │                   │
▼     ▼              ▼                   ▼
classifier.predict()  regressor.predict()  clusterer.predict()
(SVM / LR)           (XGBoost)            (K-Means)
│                     │                   │
▼                     ▼                   ▼
readiness_state    kcal_expenditure    cluster_id → label
│                     │                   │
└─────────────────────┴───────────────────┘
                       │
                       ▼
              PredictionResponse (JSON)
```

---

## Rate Limiting

No rate limiting is enforced in development mode. For production deployments, it is recommended to enforce rate limits at the reverse proxy level (e.g., Nginx, Caddy).

---

## Versioning

The API is versioned via the URL path prefix (`/api/v1/`). Breaking changes will be introduced under `/api/v2/`.
