# Product Requirements Document (PRD) & Algorithmic Resolution

**Product Name:** BioSync: Human Performance & Recovery Engine
**Target Audience for Document:** Claude Opus 4.6 (For System Architecture & Pipeline Design)

---

## 1. Executive Summary & Product Vision

BioSync is a predictive biometric telemetry engine designed to synthesize highly dimensional raw wearable data into actionable, continuous, and discrete predictive outputs regarding human performance. The product functions as a decoupled web application, utilizing a lightweight presentation layer built on **Next.js** to communicate with a robust, containerized **Python machine learning backend**. The architecture is engineered to demonstrate production-grade data pipeline orchestration while rigorously fulfilling specific Applied Machine Learning academic outcomes.

---

## 2. User Personas & The Problem Domain

Modern wearable technology generates massive volumes of physiological data (Resting Heart Rate, HRV, Sleep Stages, Activity Levels), but users face severe bottlenecks in extracting utility from this data.

**The Primary User Persona: "The High-Performer"**
This user (e.g., an athlete, an intensive academic student, or a busy professional) tracks their daily vitals but lacks the mathematical tooling to predict their physical readiness or impending burnout before beginning their day.

**The Core Problems:**

1. **Diagnostic vs. Predictive Utility:** Current tools act as historical dashboards rather than predictive oracles.
2. **Dimensionality and Noise:** Raw biometric arrays suffer from the curse of dimensionality, multicollinearity, and significant scaling disparities that human intuition cannot parse.

---

## 3. Scope Boundaries & Anti-Goals

To maintain a strict execution timeline and guarantee high-fidelity ML pipelines, the following boundaries are enforced:

**In Scope:**
- Static CSV ingestion (training data)
- RESTful API communication via JSON payloads
- Real-time inference on user-inputted daily telemetry arrays
- Interactive frontend data visualization

**Out of Scope (Anti-Goals):**
- Real-time OAuth integration with live wearable APIs (e.g., Apple HealthKit, Garmin API)
- User authentication / database persistence (PostgreSQL / MongoDB)
- Processing of raw waveform audio/video data

---

## 4. Algorithmic Resolution & Core Pipeline Directives

The backend logic engine must execute a multi-stage machine learning pipeline. The mathematical logic must sequentially execute the following operations to ensure data integrity and predictive accuracy.

---

### Phase A — Data Ingestion & Pre-processing
> **Constraint: CO1**

- **Missing Data & Imputation:** Programmatically identify unrecorded biometric fields and apply appropriate imputation strategies to prevent data leakage.
- **Scaling & Normalization:** Apply standard scaling to distance-based algorithms and normalization where appropriate, ensuring no single feature (e.g., a daily step count of 15,000) dominates the weight distribution of smaller metrics (e.g., an HRV of 45ms).
- **Class Imbalance:** Implement techniques like **SMOTE** or class-weight adjustments to ensure minority classes (e.g., severe burnout days) are mathematically respected.

---

### Phase B — Feature Engineering & Dimensionality Reduction
> **Constraint: CO2**

- **Variance Thresholding:** Evaluate all incoming features and drop metrics exhibiting near-zero variance.
- **Principal Component Analysis (PCA):** Highly correlated metrics will be compressed using PCA to capture the maximum explained variance ratio while reducing computational overhead.

---

### Phase C — Discrete State Classification
> **Constraint: CO3**

- **Objective:** Predict the user's daily recovery state (e.g., *"Optimal Readiness"*, *"Moderate Strain"*, *"High Risk of Burnout"*).
- **Execution:** Deploy non-linear or distance-based models — Support Vector Machines, Logistic Regression, or K-Nearest Neighbors.
- **Evaluation Metrics:** Confusion Matrices, ROC-AUC, and Precision-Recall curves.

---

### Phase D — Continuous Expenditure Regression
> **Constraint: CO4 & CO5**

- **Objective:** Predict the exact continuous value of *"Active Calories Burned"* for the upcoming 24-hour cycle.
- **Execution:** Implement an ensemble learning approach — Random Forest, Gradient Boosting, or XGBoost.
- **Hyperparameter Tuning:** Utilize systematic Grid Search, Random Search, or Bayesian Optimization to tune the ensemble's depth, learning rate, and estimators.
- **Evaluation Metrics:** Mean Absolute Error (MAE), Root Mean Squared Error (RMSE), R² score, and residual plot analysis.

---

### Phase E — Unsupervised Biometric Archetyping
> **Constraint: CO6**

- **Objective:** Group historical daily data into distinct, hidden behavioral clusters.
- **Execution:** Implement K-Means or K-Medoids clustering algorithms.
- **Evaluation Metrics:** Determine optimal clusters using the **Elbow Method** and validate separation quality using the **Silhouette Score** and **Davies-Bouldin Index**.

---

## 5. System I/O Contract & Data Architecture

The logic engine operates as a decoupled **FastAPI** service. It does not handle user interface rendering.

| Direction | Layer | Payload |
|---|---|---|
| Ingestion | Next.js → Python | Structured JSON array of the user's previous day's raw biometric integers and floats |
| Transformation | Internal | Data passed through saved Scikit-learn / XGBoost pipelines (Phases A–E) |
| Return | Python → Next.js | Standardized JSON object with strictly calculated results |

**Return Payload Schema:**

```json
{
  "readiness_classification_state": "String",
  "predicted_expenditure_value": "Float",
  "assigned_biometric_cluster": "String | Integer",
  "pipeline_validation_metrics": {
    "RMSE": "Float",
    "silhouette_score": "Float",
    "roc_auc": "Float"
  }
}
```

---

## 6. Success Metrics & Performance KPIs

The product is deemed successful when the following strict metrics are met:

| KPI | Target |
|---|---|
| Silhouette Score | > 0.5 |
| ROC-AUC | > 0.75 |
| API Round-Trip Latency | < 800ms |
| Edge-Case Resilience | No server crash or dimensionality mismatch on extreme inputs (e.g., 50,000 steps, 1 hr sleep) |

> All validation metrics must mathematically prove the models perform significantly better than a baseline random guess.

---

## 7. AI Orchestration Strategy

| Agent | Responsibility |
|---|---|
| **Claude Opus 4.6** *(Current Reader)* | Digest this PRD to map the overarching architecture blueprint, solve theoretical math bottlenecks, and define exact data structures |
| **Claude Sonnet 4.6** | Execute line-by-line generation of the Next.js UI, Tailwind styling, and Python FastAPI scaffolding |
| **Google Jules** *(Via GitHub)* | Asynchronous background operations: generate automated test suites for Python pipelines and manage infrastructure boilerplate (Dockerfiles) |
