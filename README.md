<div align="center">

# BioSync

### Human Performance & Recovery Engine

*Predictive biometric telemetry — from raw wearable data to actionable intelligence*

[![Next.js](https://img.shields.io/badge/Next.js-16.1-black?logo=next.js&logoColor=white)](https://nextjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.133-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Python](https://img.shields.io/badge/Python-3.13+-3776AB?logo=python&logoColor=white)](https://python.org)
[![Scikit-learn](https://img.shields.io/badge/Scikit--learn-1.8-F7931E?logo=scikit-learn&logoColor=white)](https://scikit-learn.org)
[![XGBoost](https://img.shields.io/badge/XGBoost-latest-006600?logo=xgboost)](https://xgboost.ai)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.x-38BDF8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](https://docker.com)
[![License](https://img.shields.io/badge/License-Academic-blueviolet)](./LICENSE)

---

**[Documentation](#documentation) · [Quick Start](#quick-start) · [API Reference](./Docs/API_REFERENCE.md) · [ML Pipeline](./Docs/ML_PIPELINE.md) · [Architecture](./Docs/ARCHITECTURE.md) · [Contributing](./CONTRIBUTING.md)**

</div>

---

## Overview

BioSync is a full-stack machine learning application that ingests a user's daily biometric telemetry — heart rate variability, sleep architecture, activity levels, oxygen saturation — and produces three simultaneous predictive outputs through a multi-stage ML pipeline.

| Output | Model | Task |
|---|---|---|
| **Readiness State** | SVM (RBF kernel) | 3-class classification |
| **Energy Expenditure** | XGBoost + GridSearchCV | Continuous regression |
| **Biometric Archetype** | K-Means clustering | Unsupervised profiling |

All predictions are served through a **FastAPI** REST service and rendered in a premium **Bento Grid** dashboard built with **Next.js 16**, **Framer Motion**, and **Recharts**.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
  - [Prerequisites](#prerequisites)
  - [Backend — Docker (Recommended)](#1-backend--docker-recommended)
  - [Backend — Local Python](#2-backend--local-python)
  - [Frontend](#3-frontend)
  - [Verify Integration](#4-verify-integration)
- [Environment Variables](#environment-variables)
- [Documentation](#documentation)
- [Academic Context](#academic-context--cse274)
- [Performance Benchmarks](#performance-benchmarks)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- 🧠 **Three-headed ML pipeline** — classification, regression, and clustering running in parallel per request
- ⚡ **Sub-200ms API latency** on local hardware (models pre-loaded at startup via FastAPI lifespan)
- 🎛️ **Premium dashboard UI** — Bento Grid layout, Montserrat/Poppins typography, iOS-style sliders, Framer Motion 3D tilt
- 📊 **Interactive charts** — Recharts area chart (energy trend) and scatter plot (cluster landscape)
- 🔄 **Reproducible training** — single `python -m ml.train` command rebuilds all artifacts from raw CSV
- 🐳 **Dockerised backend** — zero-dependency deployment with pre-trained model artifacts baked in
- ✅ **Pydantic v2 validation** — field-level range constraints with auto-generated OpenAPI schema
- 🛡️ **SMOTE class balancing** — handles skewed readiness label distribution in training data

---

## Tech Stack

### Frontend

| Technology | Version | Role |
|---|---|---|
| Next.js | 16.1 | App Router, React 19, Turbopack dev server |
| Tailwind CSS | 4.x | Utility-first styling, CSS-native design tokens |
| Framer Motion | 12.x | Physics-based animations, 3D card tilt, count-up numbers |
| Recharts | 3.x | Composable SVG charts (AreaChart, ScatterChart) |
| Montserrat + Poppins | Google Fonts | Editorial headings + clean body typography |

### Backend

| Technology | Version | Role |
|---|---|---|
| Python | 3.13+ | Runtime |
| FastAPI | 0.133.1 | Async REST API, auto OpenAPI docs |
| Pydantic | v2 | Request/response validation with field constraints |
| Scikit-learn | 1.8.0 | Preprocessing pipeline, SVM, KMeans, metrics |
| XGBoost | latest | Gradient boosted ensemble regressor |
| imbalanced-learn | latest | SMOTE oversampling for class balance |
| Pandas / NumPy | 2.x / 1.24+ | Data manipulation |
| Joblib | latest | Model serialisation (.pkl) |
| Uvicorn | latest | ASGI server |

### DevOps

| Technology | Role |
|---|---|
| Docker | Containerised backend for production-ready deployment |
| uv / pip | Python dependency management and locking |

---

## Project Structure

```
BioSync/
├── frontend/                        # Next.js 16 application
│   ├── app/
│   │   ├── layout.tsx               # Root layout — Google Fonts, metadata
│   │   ├── page.tsx                 # Main Bento Grid dashboard
│   │   └── globals.css              # Design system — tokens, glass-card, ios-slider
│   ├── components/
│   │   ├── BentoCard.tsx            # Reusable card with 3D tilt (Framer Motion)
│   │   ├── TelemetryInput.tsx       # iOS-style slider panel
│   │   ├── ReadinessOracle.tsx      # Classification result widget
│   │   ├── EnergyForecast.tsx       # Regression chart widget
│   │   ├── ClusterArchetype.tsx     # Cluster scatter plot widget
│   │   └── AnimatedNumber.tsx       # Spring-animated count-up number
│   ├── lib/
│   │   └── api.ts                   # Typed fetch client for the FastAPI endpoint
│   ├── public/
│   ├── package.json
│   ├── next.config.ts
│   └── tsconfig.json
│
├── backend/                         # Python FastAPI service
│   ├── app/
│   │   ├── main.py                  # FastAPI factory, CORS, lifespan model loading
│   │   ├── routes/
│   │   │   └── predict.py           # POST /api/v1/predict   GET /api/v1/health
│   │   ├── models/
│   │   │   ├── schemas.py           # Pydantic BiometricInput / PredictionResponse
│   │   │   └── inference.py         # Model loading & prediction orchestration
│   │   └── core/
│   │       └── config.py            # Settings, artifact paths
│   ├── ml/
│   │   ├── train.py                 # End-to-end training script
│   │   ├── generate_data.py         # Synthetic biometric dataset generator
│   │   ├── data/
│   │   │   └── biometric_data.csv   # 2,000-row synthetic training dataset
│   │   └── artifacts/               # Saved .pkl models + training_metrics.json
│   │       ├── preprocessing_pipeline.pkl
│   │       ├── classifier_model.pkl
│   │       ├── regressor_model.pkl
│   │       ├── clusterer_model.pkl
│   │       └── training_metrics.json
│   ├── Dockerfile
│   ├── requirements.txt
│   └── pyproject.toml
│
├── Docs/                            # Full project documentation
│   ├── API_REFERENCE.md             # Complete API specification
│   ├── ML_PIPELINE.md               # ML design, preprocessing, models, metrics
│   └── ARCHITECTURE.md              # System architecture & data flow
│
├── CONTRIBUTING.md
└── README.md
```

---

## Quick Start

### Prerequisites

| Requirement | Version |
|---|---|
| Node.js | ≥ 20.x |
| npm | ≥ 10.x |
| Python | ≥ 3.13 |
| Docker | Latest (optional, for backend) |

### 1. Clone the Repository

```bash
git clone https://github.com/AkshatTm/CSE274-Project.git
cd CSE274-Project
```

---

### 2. Backend — Docker (Recommended)

```bash
cd backend

# Build the image (models are baked in via artifacts/)
docker build -t biosync-backend .

# Run the container
docker run -p 8000:8000 biosync-backend
```

- **API Base:** `http://localhost:8000`
- **Interactive Docs:** `http://localhost:8000/docs`
- **Alternative Docs:** `http://localhost:8000/redoc`

---

### 3. Backend — Local Python

```bash
cd backend

# Create and activate virtual environment
python -m venv .venv

# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# (Optional) Retrain models from scratch
python -m ml.train

# Start the API server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

> **Note:** Pre-trained model artifacts are already committed to the repository. You only need to run `python -m ml.train` if you want to experiment with the training pipeline or have modified the dataset.

---

### 4. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start the development server (Turbopack)
npm run dev
```

The dashboard is available at **`http://localhost:3000`**.

---

### 5. Verify Integration

1. Open `http://localhost:3000`
2. Adjust the 10 biometric sliders (Resting HR, HRV, Sleep, Steps, etc.)
3. Click **"Synthesize Vitals"**
4. Watch the three prediction widgets populate:
   - **Readiness Oracle** → discrete state + confidence score
   - **Energy Forecast** → predicted kilocalories + 7-day chart
   - **Biometric Archetype** → cluster assignment + scatter visualisation

---

## Environment Variables

### Frontend (`frontend/.env.local`)

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Base URL of the FastAPI backend |

### Backend

No environment variables are required for local development. All paths are resolved relative to the `ml/artifacts/` directory via `backend/app/core/config.py`.

---

## Documentation

| Document | Description |
|---|---|
| [API Reference](./Docs/API_REFERENCE.md) | Full REST API specification, request/response schemas, error codes, cURL examples |
| [ML Pipeline](./Docs/ML_PIPELINE.md) | Preprocessing, model selection, hyperparameter tuning, evaluation metrics, and retraining guide |
| [Architecture](./Docs/ARCHITECTURE.md) | System design, data flow diagram, component responsibilities, and deployment topology |
| [Contributing](./CONTRIBUTING.md) | Development setup, branch strategy, code style, PR guidelines |

---

## Academic Context — CSE274

This project is a portfolio piece for **CSE274 — Applied Machine Learning**. Every design decision maps to a specific Course Outcome.

| CO | Topic | Implementation |
|---|---|---|
| **CO1** | Data Pre-processing | Median `SimpleImputer`, `StandardScaler`, `SMOTE` oversampling |
| **CO2** | Feature Engineering & Dimensionality Reduction | `VarianceThreshold` (0.01), `PCA` at 95% explained variance |
| **CO3** | Classification | SVM (RBF kernel), vs. Logistic Regression baseline; ROC-AUC, Confusion Matrix, Precision-Recall |
| **CO4** | Regression | XGBoost ensemble; MAE, RMSE, R² evaluation |
| **CO5** | Ensemble & Hyperparameter Tuning | `GridSearchCV` over XGBoost (`n_estimators`, `max_depth`, `learning_rate`, `subsample`, `colsample_bytree`), 5-fold CV |
| **CO6** | Unsupervised Learning | K-Means with Elbow Method, Silhouette Score, Davies-Bouldin Index; auto-labeling by cluster centroid statistics |

---

## Performance Benchmarks

| Metric | Target | Description |
|---|---|---|
| ROC-AUC | > 0.75 | Weighted OVR for 3-class readiness classifier |
| R² | > 0.85 | Explained variance on calorie regression holdout |
| RMSE | < 60 kcal | Root mean squared error on regression holdout |
| Silhouette Score | > 0.50 | Cluster separation quality |
| API Round-Trip | < 200 ms | End-to-end predict latency on local hardware |

---

## Roadmap

- [ ] Real wearable device integration (Garmin / Apple Health API)
- [ ] Time-series model variant (LSTM for 7-day trend prediction)
- [ ] User authentication and personalised model fine-tuning
- [ ] Production deployment (Vercel + Railway)
- [ ] Automated model drift detection and retraining

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development setup, branch conventions, commit message format, and pull request guidelines.

---

## License

This project is developed for academic purposes as part of **CSE274 — Applied Machine Learning**. All rights reserved by the author.

---

<div align="center">
  <sub>Built by <strong>Akshat</strong> for <strong>CSE274: Applied Machine Learning</strong></sub>
</div>
