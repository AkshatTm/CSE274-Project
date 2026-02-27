# Product Requirements Document (PRD) & Algorithmic Resolution

**Product Name:** BioSync: Human Performance & Recovery Engine
**Target Audience for Document:** Claude Opus 4.6 (For System Architecture & Pipeline Design)

---

## 1. Executive Summary & Engineering Objective

BioSync is a predictive biometric telemetry engine designed to synthesize highly dimensional raw wearable data into actionable predictive outputs regarding human performance.

**Crucial Context for Architecture Design:** This project is fundamentally an academic task for a 4th-semester engineering course: **CSE274 - Applied Machine Learning**. Therefore, the architecture must strictly serve as a practical vessel to demonstrate mastery of the syllabus. The product functions as a decoupled web application, utilizing a **Next.js** presentation layer to communicate with a robust **Python machine learning backend**. The primary objective is to build an impressive, intermediate-difficulty portfolio piece while rigorously fulfilling the specific academic course outcomes **(CO1 through CO6)** detailed below.

---

## 2. User Personas & The Problem Domain

Modern wearable technology generates massive volumes of physiological data (Resting Heart Rate, HRV, Sleep Stages, Activity Levels), but users face severe bottlenecks in extracting utility from this data.

**The Primary User Persona: "The High-Performer"**
This user tracks their daily vitals but lacks the mathematical tooling to predict their physical readiness or impending burnout before beginning their day.

**The Core Problems:**

1. **Diagnostic vs. Predictive Utility:** Current tools act as historical dashboards rather than predictive oracles.
2. **Dimensionality and Noise:** Raw biometric arrays suffer from the curse of dimensionality, multicollinearity, and significant scaling disparities that human intuition cannot parse.

---

## 3. Scope Boundaries & Anti-Goals

To maintain a strict execution timeline and guarantee high-fidelity ML pipelines suitable for an academic submission, the following boundaries are enforced:

**In Scope:**
- Static CSV ingestion for model training
- RESTful API communication via JSON payloads
- Real-time inference on user-inputted daily telemetry arrays
- Interactive frontend data visualization using Next.js

**Out of Scope (Anti-Goals):**
- Real-time OAuth integration with live wearable APIs (e.g., Apple HealthKit)
- User authentication / database persistence (PostgreSQL / MongoDB)
- Processing of raw waveform audio/video data

---

## 4. Algorithmic Resolution & Core Syllabus Directives

The backend logic engine must execute a multi-stage machine learning pipeline. To satisfy the **CSE274** curriculum, the mathematical logic must sequentially execute the following operations:

---

### Phase A — Data Ingestion & Pre-processing
> **Syllabus Constraint: CO1**

- **Execution:** Programmatically identify unrecorded biometric fields and apply appropriate imputation strategies.
- **Scaling:** Apply standard scaling to distance-based algorithms and normalization where appropriate, ensuring no single feature (e.g., a daily step count of 15,000) dominates the weight distribution of smaller metrics (e.g., an HRV of 45ms).
- **Imbalance:** Implement techniques like **SMOTE** or class-weight adjustments to ensure minority classes are mathematically respected.

---

### Phase B — Feature Engineering & Dimensionality Reduction
> **Syllabus Constraint: CO2**

- **Execution:** Evaluate all incoming features and drop metrics exhibiting near-zero variance. Highly correlated metrics will be compressed using **Principal Component Analysis (PCA)** to capture the maximum explained variance ratio while reducing computational overhead.

---

### Phase C — Discrete State Classification
> **Syllabus Constraint: CO3**

- **Objective:** Predict the user's daily recovery state (e.g., *"Optimal Readiness"*, *"Moderate Strain"*, *"High Risk of Burnout"*).
- **Execution:** Deploy non-linear or distance-based models — Support Vector Machines, Logistic Regression, or K-Nearest Neighbors.
- **Evaluation Metrics:** Must be validated using Confusion Matrices, ROC-AUC, and Precision-Recall curves.

---

### Phase D — Continuous Expenditure Regression
> **Syllabus Constraint: CO4 & CO5**

- **Objective:** Predict the exact continuous value of *"Active Calories Burned"* for the upcoming 24-hour cycle.
- **Execution:** Implement an ensemble learning approach — Random Forest, Gradient Boosting, or XGBoost.
- **Hyperparameter Tuning:** Utilize systematic Grid Search, Random Search, or Bayesian Optimization to tune the ensemble's depth, learning rate, and estimators.
- **Evaluation Metrics:** Mean Absolute Error (MAE), Root Mean Squared Error (RMSE), R² score, and residual plot analysis.

---

### Phase E — Unsupervised Biometric Archetyping
> **Syllabus Constraint: CO6**

- **Objective:** Group historical daily data into distinct, hidden behavioral clusters.
- **Execution:** Implement K-Means or K-Medoids clustering algorithms.
- **Evaluation Metrics:** Determine optimal clusters using the **Elbow Method** and validate separation quality using the **Silhouette Score** and **Davies-Bouldin Index**.

---

## 5. System I/O Contract & Data Architecture

The logic engine operates as a decoupled **Python FastAPI** service. It does not handle user interface rendering, which is strictly managed by **Next.js**.

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

> `pipeline_validation_metrics` are included for UI rendering and academic transparency.

---

## 6. Success Metrics & Performance KPIs

The product is deemed successful when the following strict metrics are met:

| KPI | Target |
|---|---|
| Silhouette Score | > 0.5 |
| ROC-AUC | > 0.75 |
| API Round-Trip Latency | Resolve rapidly for a kinetic, seamless UI experience |
| Edge-Case Resilience | No server crash or dimensionality mismatch on extreme inputs (e.g., 50,000 steps, 1 hr sleep) |

> All validation metrics must mathematically prove the models perform significantly better than a baseline random guess.

---

## 7. AI Orchestration Strategy

| Agent | Responsibility |
|---|---|
| **Claude Opus 4.6** *(Current Reader)* | Digest this PRD to map the overarching architecture blueprint, solve theoretical math bottlenecks, and design a flawless implementation plan that connects the frontend and backend while perfectly satisfying the academic syllabus |
| **Claude Sonnet 4.6** | Used subsequently to execute line-by-line generation of the Next.js UI, Tailwind styling, and Python FastAPI scaffolding based on the architectural blueprint |
