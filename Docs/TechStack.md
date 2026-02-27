# Technical Stack & Architecture Document

**Product Name:** BioSync: Human Performance & Recovery Engine
**Target Audience:** Engineering Implementation Team / Claude Sonnet 4.6

---

## 1. Architectural Philosophy

BioSync strictly adheres to a **decoupled, client-server architecture**. The presentation layer is entirely isolated from the mathematical logic engine. This division of concerns allows the application to meet the high performance and security standards expected in enterprise environments while perfectly satisfying the machine learning implementation constraints of the academic syllabus.

---

## 2. Frontend Presentation Layer — *The Canvas*

The client-side application is strictly responsible for state management, biometric input collection, and rendering the predictive outputs. No complex data transformations or algorithmic calculations occur here.

| Concern | Technology | Version |
|---|---|---|
| Core Framework | Next.js | v16.1 |
| Styling Engine | Tailwind CSS | v4.2 |
| Data Visualization | Recharts | latest |

### Core Framework — Next.js (v16.1)

> Utilizing the latest Next.js 16 release ensures access to stable **Turbopack** for lightning-fast compilation, native **React Compiler** support, and optimized caching APIs. It provides a robust, strictly-typed foundation to communicate with the ML API.

### Styling Engine — Tailwind CSS (v4.2)

> The newly released v4 architecture eliminates the need for bulky preprocessors, relying entirely on modern native CSS variables and the `@utility` directive. This guarantees a kinetic, minimal UI with zero-config design tokens.

### Data Visualization — Recharts

> A lightweight, composable React charting library. It will be used to render the K-Means biometric clusters (scatter plots) and continuous regression outputs (line graphs) flawlessly without bloating the client bundle.

---

## 3. Backend Logic & ML Engine — *The Brain*

The backend is a strictly typed API designed to ingest raw telemetry, execute data pre-processing, run validated machine learning pipelines, and return continuous/discrete predictions.

| Concern | Technology | Version |
|---|---|---|
| API Framework | FastAPI | v0.133.1 |
| Runtime | Python | 3.13 / 3.14 |
| ML Core | Scikit-learn | v1.8.0 |
| Ensemble Engine | XGBoost | latest |
| Data Manipulation | Pandas | >= 2.0 |
| Data Manipulation | NumPy | >= 1.24.1 |

### API Framework — FastAPI (v0.133.1)

> FastAPI is the industry standard for serving ML models. Leveraging **Pydantic 2** for strict data validation ensures that malformed biometric arrays (e.g., negative sleep hours inputted by a user) are caught instantly before hitting the regression models. It offers native async support, vastly outperforming Flask in production.

### Runtime Environment — Python 3.13 / 3.14

> Takes advantage of the **free-threaded CPython** optimizations available in the latest Python releases for faster concurrent request handling and mathematical computations.

### ML Core — Scikit-learn (v1.8.0)

> The latest 1.8.0 release natively supports the **Array API** and free-threaded execution. This library handles all core syllabus requirements: Data Imputation, PCA, Variance Thresholding, Logistic Regression (Classification), and K-Means (Clustering).

### Ensemble Engine — XGBoost

> To satisfy the continuous expenditure regression outcomes **(CO4 & CO5)**, XGBoost provides a highly optimized gradient boosting framework that natively integrates with Scikit-learn's Grid Search for systematic hyperparameter tuning.

### Data Manipulation — Pandas (>= 2.0) & NumPy (>= 1.24.1)

> Essential for the initial CSV data ingestion, matrix manipulation, and scaling required prior to model training.

---

## 4. Infrastructure & DevOps

To elevate this project from a standard academic assignment to a production-grade portfolio piece, the ML backend will be containerized.

| Concern | Technology |
|---|---|
| Containerization | Docker |
| Package Management | `uv` or `pip` |

### Containerization — Docker

> Writing a declarative `Dockerfile` for the FastAPI backend proves the application can be deployed in isolated environments without dependency conflicts — a mandatory skill for modern platform engineering and MLOps.

### Package Management — uv or pip

> Modern Python package resolution to lock dependencies (`scikit-learn`, `fastapi`, `uvicorn`) ensuring reproducible builds and eliminating "it works on my machine" errors across development environments.

---

## 5. Implementation Execution Plan

When feeding this stack document to **Claude Sonnet 4.6** alongside the PRD, the strict sequence of code generation must be:

| Step | Phase | Action |
|---|---|---|
| 1 | **Frontend Scaffold** | Initialize the Next.js 16 environment and configure Tailwind v4.2 for the dark-mode/monochrome UI |
| 2 | **API Scaffold** | Build the isolated FastAPI environment and define Pydantic models for incoming biometric arrays |
| 3 | **ML Pipelines** | Write the Scikit-learn training scripts to ingest the CSV, generate the models, and save them via `joblib` as `.pkl` files |
| 4 | **Integration** | Wire the Next.js frontend to send JSON payloads and fetch predictive outputs from local FastAPI endpoints |
