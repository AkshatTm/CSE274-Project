# System Architecture

**BioSync** — Full-Stack ML Application Architecture

---

## Overview

BioSync follows a clean **client–server** separation. The frontend (Next.js) is a statically renderable React application. The backend (FastAPI) is a stateless inference service. No shared database layer exists in the current version — all persistence is limited to serialised model artifacts on the filesystem.

---

## High-Level Architecture

```
┌──────────────────────────────────────────────────────────┐
│                      USER'S BROWSER                       │
│                                                           │
│   ┌─────────────────────────────────────────────────┐    │
│   │              Next.js 16 Dashboard                │    │
│   │                                                  │    │
│   │  ┌────────────────┐    ┌───────────────────────┐ │    │
│   │  │ TelemetryInput │    │   ReadinessOracle     │ │    │
│   │  │ (10 sliders)   │    │   EnergyForecast      │ │    │
│   │  │                │    │   ClusterArchetype    │ │    │
│   │  └───────┬────────┘    └───────────────────────┘ │    │
│   │          │ POST /api/v1/predict (JSON)             │    │
│   └──────────┼─────────────────────────────────────┘    │
└──────────────┼───────────────────────────────────────────┘
               │  HTTP / REST
               ▼
┌──────────────────────────────────────────────────────────┐
│                    FastAPI Server                          │
│                  (localhost:8000)                         │
│                                                           │
│  ┌──────────────────────────────────────────────────────┐ │
│  │                   POST /api/v1/predict               │ │
│  │                                                      │ │
│  │  1. Pydantic validation (BiometricInput)             │ │
│  │  2. NumPy array construction                         │ │
│  │  3. preprocessing_pipeline.transform()               │ │
│  │  4. Parallel model inference:                        │ │
│  │     ├── classifier.predict()   → readiness           │ │
│  │     ├── regressor.predict()    → calories            │ │
│  │     └── clusterer.predict()    → cluster_id          │ │
│  │  5. Assemble PredictionResponse (Pydantic)           │ │
│  │  6. Return JSON                                      │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                           │
│  Model Artifacts (loaded at startup via FastAPI lifespan) │
│  ├── preprocessing_pipeline.pkl                          │
│  ├── classifier_model.pkl                                │
│  ├── regressor_model.pkl                                 │
│  ├── clusterer_model.pkl                                 │
│  └── training_metrics.json                               │
└──────────────────────────────────────────────────────────┘
```

---

## Component Responsibilities

### Frontend

| Component | File | Responsibility |
|---|---|---|
| `Dashboard` | `app/page.tsx` | Root state management, API call, grid layout |
| `TelemetryInput` | `components/TelemetryInput.tsx` | 10-slider input form, calls `onSubmit` |
| `ReadinessOracle` | `components/ReadinessOracle.tsx` | Renders classification state + confidence score |
| `EnergyForecast` | `components/EnergyForecast.tsx` | Renders predicted kcal + 7-day area chart |
| `ClusterArchetype` | `components/ClusterArchetype.tsx` | Renders cluster ID/label + scatter plot |
| `BentoCard` | `components/BentoCard.tsx` | Shared card wrapper with 3D tilt (Framer Motion) |
| `AnimatedNumber` | `components/AnimatedNumber.tsx` | Spring-animated count-up number display |
| `api.ts` | `lib/api.ts` | Typed `fetchPrediction()` fetch client |

### Backend

| Module | File | Responsibility |
|---|---|---|
| App Factory | `app/main.py` | FastAPI instantiation, CORS, lifespan (model loading) |
| Predict Route | `app/routes/predict.py` | `POST /api/v1/predict`, `GET /api/v1/health` |
| Schemas | `app/models/schemas.py` | Pydantic `BiometricInput`, `PredictionResponse`, `PipelineMetrics` |
| Inference | `app/models/inference.py` | Model loading (`load_models`), prediction orchestration (`predict`) |
| Config | `app/core/config.py` | Artifact file paths, settings |
| Training | `ml/train.py` | Full offline training pipeline |
| Data Gen | `ml/generate_data.py` | Synthetic dataset generator |

---

## Data Flow (Detailed)

```
1. User adjusts sliders (TelemetryInput)
        │
        ▼
2. User clicks "Synthesize Vitals"
        │
        ▼
3. fetchPrediction(BiometricInput) called  [lib/api.ts]
        │  POST http://localhost:8000/api/v1/predict
        ▼
4. Pydantic validates BiometricInput
   (10 fields, each with min/max constraints)
        │
        ▼
5. Input converted to NumPy array (1 × 10)
        │
        ▼
6. preprocessing_pipeline.transform(X)
   ├── SimpleImputer  → handles any NaN
   ├── StandardScaler → z-score normalisation
   ├── VarianceThreshold → drops near-zero variance cols
   └── PCA (95%)      → projects to k principal components
        │
        ▼ (1 × k array, k ≤ 10)
        │
        ├──────────────────────┬──────────────────────────┐
        ▼                      ▼                          ▼
7a. classifier.predict()  7b. regressor.predict()  7c. clusterer.predict()
    SVM (RBF)                 XGBoost                  K-Means
    → label (str)             → calories (float)       → cluster_id (int)
    → probabilities           → clipped to ≥ 0         → lookup label str
        │                          │                          │
        └──────────────────────────┴──────────────────────────┘
                                   │
                                   ▼
8. PredictionResponse assembled (Pydantic)
   + training_metrics.json read for pipeline_validation_metrics
        │
        ▼
9. JSON response returned to browser
        │
        ▼
10. React state updated → component re-render
    ├── ReadinessOracle → shows state, score, colour tint
    ├── EnergyForecast  → shows kcal, renders 7-day chart
    └── ClusterArchetype → shows label, renders scatter plot
```

---

## Model Loading Strategy

Models are loaded **once at application startup** using FastAPI's `lifespan` context manager:

```python
# app/main.py
@asynccontextmanager
async def lifespan(app: FastAPI):
    load_models()   # Loads all .pkl files into module-level globals
    yield
    # (cleanup on shutdown if needed)
```

**Benefit:** Avoids repeated disk I/O on each request. Since scikit-learn and XGBoost models are not thread-safe for writing but are safe for concurrent reading, this approach is valid for the current single-worker Uvicorn setup.

---

## CORS Configuration

The FastAPI backend allows requests from any origin in development:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
```

For production, restrict `allow_origins` to your frontend domain.

---

## Deployment Topology

### Local Development

```
localhost:3000  (Next.js dev server — Turbopack)
      │  HTTP
localhost:8000  (Uvicorn — single worker, --reload)
      │  filesystem
ml/artifacts/   (.pkl files)
```

### Docker (Backend Only)

```
docker run -p 8000:8000 biosync-backend
      │
      └── Uvicorn + FastAPI + pre-baked artifacts inside container
```

The frontend in production should be deployed to **Vercel** (zero-config for Next.js) with the backend deployed to **Railway**, **Fly.io**, or **Render** using the provided `Dockerfile`.

---

## Key Design Decisions

| Decision | Rationale |
|---|---|
| **Stateless API** | No session or user data stored — each request is self-contained |
| **Models loaded at startup** | Eliminates per-request disk I/O; acceptable for single-instance deployment |
| **Pydantic v2 validation** | Field-level constraints (`ge`, `le`) provide a first line of defense against invalid biometric inputs |
| **Single combined endpoint** | All three ML models called per request — avoids round-trip latency for the UI which renders all three widgets simultaneously |
| **Pre-trained artifacts committed to Git** | Allows the frontend demo to work immediately without requiring a training run |
| **Scikit-learn Pipeline for preprocessing** | Ensures identical transformations at train and inference time — no data leakage risk |
