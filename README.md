# BioSync: Human Performance & Recovery Engine

<p align="center">
  <strong>A predictive biometric telemetry engine that transforms raw wearable data into actionable performance insights.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.1-black?logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/FastAPI-0.133-009688?logo=fastapi" alt="FastAPI">
  <img src="https://img.shields.io/badge/Scikit--learn-1.8-F7931E?logo=scikit-learn" alt="Scikit-learn">
  <img src="https://img.shields.io/badge/XGBoost-latest-006600" alt="XGBoost">
  <img src="https://img.shields.io/badge/Tailwind_CSS-4.2-38BDF8?logo=tailwindcss" alt="Tailwind">
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker" alt="Docker">
  <img src="https://img.shields.io/badge/Python-3.13+-3776AB?logo=python" alt="Python">
</p>

---

## Vision

Modern wearables generate massive volumes of physiological data — heart rate variability, sleep architecture, activity levels — yet users are left with backward-looking dashboards rather than forward-looking intelligence. **BioSync** bridges this gap.

BioSync ingests a user's daily biometric telemetry and runs it through a multi-stage machine learning pipeline to deliver three distinct predictive outputs:

1. **Readiness Classification** — A discrete state prediction (*Optimal Readiness*, *Moderate Strain*, or *High Risk of Burnout*) powered by Support Vector Machines.
2. **Energy Expenditure Forecast** — A continuous prediction of "Active Calories Burned" for the next 24 hours using XGBoost ensemble regression.
3. **Biometric Archetyping** — An unsupervised cluster assignment that maps the user's daily profile to a hidden behavioral pattern using K-Means.

All predictions are served through a FastAPI REST service and rendered in a premium, kinetic **"Glassmorphism"** interface built with Next.js 16.

---

## Academic Context — CSE274: Applied Machine Learning

This project is designed as a comprehensive portfolio piece for the **CSE274 — Applied Machine Learning** curriculum. Every architectural decision maps directly to a specific Course Outcome.

| Course Outcome | Description | BioSync Implementation |
|---|---|---|
| **CO1** | Data Pre-processing & Wrangling | Median imputation (`SimpleImputer`), feature scaling (`StandardScaler`), class imbalance handling (`SMOTE`) |
| **CO2** | Feature Engineering & Dimensionality Reduction | Near-zero variance filtering (`VarianceThreshold`), covariance-based compression (`PCA` at 95% explained variance) |
| **CO3** | Classification Algorithms | SVM with RBF kernel for recovery state prediction; evaluated via ROC-AUC, Confusion Matrix, Precision-Recall |
| **CO4** | Regression Algorithms | XGBoost Gradient Boosted Trees for calorie expenditure prediction; evaluated via MAE, RMSE, R² |
| **CO5** | Ensemble Methods & Hyperparameter Tuning | `GridSearchCV` over XGBoost parameter space (depth, learning rate, estimators, subsample) with 5-fold CV |
| **CO6** | Unsupervised Learning / Clustering | K-Means clustering with Elbow Method, Silhouette Score (> 0.5 target), and Davies-Bouldin Index |

---

## Tech Stack

### Frontend — *The Canvas*

| Technology | Version | Purpose |
|---|---|---|
| Next.js | 16.1 | App Router, React 19, Turbopack |
| Tailwind CSS | 4.2 | Utility-first styling, CSS-native design tokens |
| Framer Motion | latest | Physics-based animations, staggered bento entrance, 3D card tilt |
| Recharts | latest | Composable SVG charts (area charts, scatter plots) |

### Backend — *The Brain*

| Technology | Version | Purpose |
|---|---|---|
| Python | 3.13+ | Runtime with free-threaded CPython optimizations |
| FastAPI | 0.133.1 | Async REST API with Pydantic v2 validation |
| Scikit-learn | 1.8.0 | Core ML pipeline (Imputer, Scaler, PCA, SVM, KMeans) |
| XGBoost | latest | Gradient boosted ensemble regression |
| imbalanced-learn | latest | SMOTE oversampling |
| Pandas / NumPy | >= 2.0 / >= 1.24 | Data manipulation and matrix operations |

### DevOps

| Technology | Purpose |
|---|---|
| Docker | Containerized backend for reproducible deployment |
| uv / pip | Dependency locking and package management |

---

## Project Structure

```
BioSync/
├── frontend/                  # Next.js 16 application
│   ├── app/
│   │   ├── layout.tsx         # Root layout — fonts, metadata
│   │   ├── page.tsx           # Main dashboard (Bento Grid)
│   │   └── globals.css        # Tailwind v4 + mesh gradient
│   ├── components/
│   │   ├── TelemetryInput.tsx  # Slider input panel
│   │   ├── ReadinessOracle.tsx # Classification widget (CO3)
│   │   ├── EnergyForecast.tsx  # Regression chart widget (CO4/5)
│   │   ├── ClusterArchetype.tsx# Clustering scatter widget (CO6)
│   │   ├── BentoCard.tsx       # Reusable glass card wrapper
│   │   └── AnimatedNumber.tsx  # Count-up number component
│   ├── lib/
│   │   └── api.ts              # Fetch client for FastAPI
│   ├── package.json
│   └── tailwind.config.ts
│
├── backend/                   # Python FastAPI service
│   ├── app/
│   │   ├── main.py            # FastAPI app factory + lifespan
│   │   ├── routes/
│   │   │   └── predict.py     # POST /api/v1/predict
│   │   ├── models/
│   │   │   ├── schemas.py     # Pydantic input/output models
│   │   │   └── inference.py   # Model loading & prediction logic
│   │   └── core/
│   │       └── config.py      # Settings & paths
│   ├── ml/
│   │   ├── train.py           # Full training pipeline script
│   │   ├── data/
│   │   │   └── biometric_data.csv
│   │   └── artifacts/         # Saved .pkl models + metrics.json
│   ├── Dockerfile
│   ├── requirements.txt
│   └── pyproject.toml
│
├── Docs/
│   ├── PRD.md
│   ├── TechStack.md
│   ├── UIUX.md
│   ├── SystemArchitecture.md
│   └── ImplementationPlan.md
│
└── README.md
```

---

## Quick Start

### Prerequisites

- **Node.js** >= 20.x
- **Python** >= 3.13
- **Docker** (recommended for backend)
- **uv** or **pip** (Python package manager)

### 1. Clone the Repository

```bash
git clone https://github.com/AkshatTm/CSE274-Project.git
cd CSE274-Project
```

### 2. Backend Setup (Docker — Recommended)

```bash
cd backend

# Build the container
docker build -t biosync-backend .

# Run the container
docker run -p 8000:8000 biosync-backend
```

The API will be available at `http://localhost:8000`. API docs at `http://localhost:8000/docs`.

**Alternative (Local Python):**

```bash
cd backend
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt

# Train the models (generates .pkl artifacts)
python -m ml.train

# Start the API server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The dashboard will be available at `http://localhost:3000`.

### 4. Verify Integration

1. Open `http://localhost:3000` in your browser
2. Adjust the biometric sliders (Steps, HRV, Sleep Hours, etc.)
3. Click **"Synthesize Vitals"**
4. Observe the Readiness Oracle, Energy Forecast, and Cluster Archetype widgets populate with predictions

---

## API Reference

### `POST /api/v1/predict`

**Request Body:**

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

**Response:**

```json
{
  "readiness_classification_state": "Optimal Readiness",
  "readiness_score": 87,
  "predicted_expenditure_value": 2450.3,
  "assigned_biometric_cluster": 2,
  "cluster_label": "High Strain",
  "pipeline_validation_metrics": {
    "roc_auc": 0.88,
    "rmse": 42.5,
    "r2": 0.91,
    "silhouette_score": 0.62,
    "davies_bouldin_index": 0.78
  }
}
```

### `GET /api/v1/health`

Returns `{ "status": "healthy", "models_loaded": true }`.

---

## Performance Targets

| KPI | Target | Status |
|---|---|---|
| Silhouette Score | > 0.5 | — |
| ROC-AUC | > 0.75 | — |
| API Round-Trip Latency | < 200ms | — |
| Edge-Case Resilience | No crash on extreme inputs | — |

---

## License

This project is developed for academic purposes as part of the **CSE274 — Applied Machine Learning** curriculum.

---

## Authors

- **Akshat** — Architecture, ML Pipelines, Frontend

---

<p align="center">
  <sub>Built with precision for <strong>CSE274: Applied Machine Learning</strong></sub>
</p>
