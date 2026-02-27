# High-Level System Architecture Document

**Product Name:** BioSync: Human Performance & Recovery Engine  
**Document Purpose:** Define the end-to-end data flow, component boundaries, and mathematical pipeline architecture that satisfies every CSE274 Course Outcome (CO1–CO6).

---

## 1. Architectural Overview

BioSync employs a **strictly decoupled client-server architecture** with two independent runtime processes communicating over HTTP/JSON:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          USER'S BROWSER                                     │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                    NEXT.JS 16 PRESENTATION LAYER                      │  │
│  │                                                                       │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────┐  │  │
│  │  │  Telemetry   │  │  Readiness   │  │   Energy     │  │ Cluster  │  │  │
│  │  │  Input Panel │  │  Oracle Card │  │  Forecast    │  │ Archetype│  │  │
│  │  │  (Sliders)   │  │  (CO3)       │  │  Card (CO4/5)│  │ Card(CO6)│  │  │
│  │  └──────┬───────┘  └──────▲───────┘  └──────▲───────┘  └────▲─────┘  │  │
│  │         │                 │                 │               │         │  │
│  │         │        ┌────────┴─────────────────┴───────────────┘         │  │
│  │         │        │   Parse JSON Response & Render via Recharts        │  │
│  │         ▼        │                                                    │  │
│  │  ┌───────────────┴───────────────────────────────────────────────┐    │  │
│  │  │              API CLIENT (fetch / SWR)                          │    │  │
│  │  │  POST /api/predict  →  JSON { steps, hrv, sleep_hrs, ... }    │    │  │
│  │  └───────────────────────────┬───────────────────────────────────┘    │  │
│  └──────────────────────────────┼────────────────────────────────────────┘  │
└─────────────────────────────────┼───────────────────────────────────────────┘
                                  │  HTTP / JSON
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     FASTAPI BACKEND (Docker Container)                       │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                  PYDANTIC v2 INPUT VALIDATION                       │    │
│  │    Reject negative sleep, NaN heart rates, out-of-range values      │    │
│  └──────────────────────────────┬──────────────────────────────────────┘    │
│                                 ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │              PHASE A — PRE-PROCESSING (CO1)                         │    │
│  │  SimpleImputer → StandardScaler → SMOTE (training only)             │    │
│  └──────────────────────────────┬──────────────────────────────────────┘    │
│                                 ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │              PHASE B — FEATURE ENGINEERING (CO2)                     │    │
│  │  VarianceThreshold → PCA (n_components = 0.95 explained variance)   │    │
│  └──────────────────────────────┬──────────────────────────────────────┘    │
│                                 ▼                                           │
│  ┌──────────────┐  ┌──────────────────┐  ┌─────────────────────────┐       │
│  │  PHASE C     │  │  PHASE D         │  │  PHASE E                │       │
│  │  Classifier  │  │  Regressor       │  │  Clusterer              │       │
│  │  (CO3)       │  │  (CO4/CO5)       │  │  (CO6)                  │       │
│  │  SVM / LR    │  │  XGBoost + Grid  │  │  K-Means               │       │
│  │  ↓           │  │  Search          │  │  ↓                      │       │
│  │  Readiness   │  │  ↓               │  │  Cluster ID +           │       │
│  │  State       │  │  Predicted kcal  │  │  Silhouette Score       │       │
│  └──────┬───────┘  └────────┬─────────┘  └───────────┬─────────────┘       │
│         │                   │                         │                     │
│         └───────────────────┼─────────────────────────┘                     │
│                             ▼                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │              RESPONSE SERIALIZER                                    │    │
│  │  {                                                                  │    │
│  │    "readiness_classification_state": "Optimal Readiness",           │    │
│  │    "readiness_score": 87,                                           │    │
│  │    "predicted_expenditure_value": 2450.0,                           │    │
│  │    "assigned_biometric_cluster": 2,                                 │    │
│  │    "cluster_label": "High Strain",                                  │    │
│  │    "pipeline_validation_metrics": { ... }                           │    │
│  │  }                                                                  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Component Inventory

| Layer | Component | Runtime | Key Libraries |
|---|---|---|---|
| **Frontend** | Next.js 16 App Router | Node.js | React 19, Tailwind CSS v4.2, Framer Motion, Recharts |
| **Backend** | FastAPI REST Service | Python 3.13+ | FastAPI 0.133, Pydantic v2, Uvicorn |
| **ML Core** | Training + Inference Pipelines | Python 3.13+ | Scikit-learn 1.8, XGBoost, Pandas, NumPy, imbalanced-learn |
| **DevOps** | Containerised Backend | Docker | Dockerfile, uv/pip lockfile |

---

## 3. Data Flow — Request Lifecycle

### 3.1 Ingestion (Next.js → FastAPI)

The user manipulates slider controls to enter the previous day's biometric telemetry. On clicking **"Synthesize Vitals"**, the frontend constructs and POSTs a JSON payload:

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

### 3.2 Validation Gate

FastAPI's Pydantic model enforces strict type-checking and range constraints:

```python
class BiometricInput(BaseModel):
    resting_heart_rate: float = Field(ge=30, le=220)
    hrv_ms: float = Field(ge=0, le=300)
    sleep_hours: float = Field(ge=0, le=24)
    # ... all fields with physical-reality bounds
```

Malformed or physically impossible values (e.g., negative sleep) are instantly rejected with a `422 Unprocessable Entity`, never reaching the ML pipeline.

### 3.3 Transformation (Internal Pipeline)

The validated input vector is reshaped into a single-row NumPy array and passed through **pre-fitted, joblib-serialized Scikit-learn pipelines** loaded at server startup. The three inference branches (Classification, Regression, Clustering) execute in sequence (or can be parallelized with `asyncio.gather` for latency optimization).

### 3.4 Return (FastAPI → Next.js)

A fully typed Pydantic response model serializes the predictions into the contract schema defined in the PRD:

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

---

## 4. Mathematical Pipeline Deep-Dive — Syllabus Mapping

### 4.1 Phase A — Data Pre-processing (CO1: Data Wrangling & Preparation)

**Objective:** Transform raw, noisy, heterogeneously-scaled biometric features into a clean, model-ready matrix.

**Mathematical Operations:**

1. **Missing Value Imputation** — `sklearn.impute.SimpleImputer(strategy='median')`  
   For any CSV training row where a sensor reading is absent (NaN), replace it with the column median. Median is preferred over mean because biometric data often contains outliers (e.g., a 50,000-step marathon day), and the median is robust to such skew.

2. **Feature Scaling** — `sklearn.preprocessing.StandardScaler`  
   Each feature $x_i$ is transformed via:
   $$z_i = \frac{x_i - \mu_i}{\sigma_i}$$
   Where $\mu_i$ is the feature mean and $\sigma_i$ is the standard deviation. This ensures that "Steps" (range: 0–50,000) and "HRV" (range: 20–150 ms) have equal mathematical influence in distance-based models (SVM, KNN, K-Means).

3. **Class Imbalance Handling** — `imblearn.over_sampling.SMOTE`  
   During training only, if "High Risk of Burnout" represents only 8% of training samples, SMOTE generates synthetic minority observations by interpolating between nearest neighbors in feature space:
   $$x_{\text{synthetic}} = x_i + \lambda \cdot (x_{nn} - x_i), \quad \lambda \sim U(0,1)$$
   This ensures the classifier does not trivially predict the majority class.

---

### 4.2 Phase B — Feature Engineering & Dimensionality Reduction (CO2: Feature Engineering)

**Objective:** Eliminate noise dimensions and compress correlated features while retaining maximum predictive signal.

**Mathematical Operations:**

1. **Near-Zero Variance Filtering** — `sklearn.feature_selection.VarianceThreshold(threshold=0.01)`  
   Any feature whose variance falls below 0.01 (after scaling) is removed. Mathematically, if $\text{Var}(x_j) < \epsilon$, feature $j$ carries almost no discriminative information.

2. **Principal Component Analysis (PCA)** — `sklearn.decomposition.PCA(n_components=0.95)`  
   PCA performs eigendecomposition on the covariance matrix $\Sigma$ of the feature matrix $X$:
   $$\Sigma = \frac{1}{n-1} X^T X$$
   The eigenvectors (principal components) are ranked by eigenvalue magnitude. Setting `n_components=0.95` retains the minimum number of components $k$ such that:
   $$\frac{\sum_{i=1}^{k} \lambda_i}{\sum_{i=1}^{d} \lambda_i} \geq 0.95$$
   This compresses multicollinear features (e.g., Steps and Active Minutes, which are highly correlated) into orthogonal principal components, reducing model complexity without significant information loss.

---

### 4.3 Phase C — Discrete State Classification (CO3: Classification Algorithms)

**Objective:** Predict a categorical readiness label from the feature vector.

**Target Variable Construction (during training):**  
A composite "Readiness Score" is derived from the raw CSV features via a weighted formula, then discretized into three ordinal classes:

| Score Range | Label |
|---|---|
| 70–100 | Optimal Readiness |
| 40–69 | Moderate Strain |
| 0–39 | High Risk of Burnout |

**Model: Support Vector Machine (SVM)** — `sklearn.svm.SVC(kernel='rbf', probability=True)`  
SVM finds the optimal separating hyperplane by solving:
$$\min_{w, b} \frac{1}{2} \|w\|^2 + C \sum_{i=1}^{n} \xi_i$$
subject to $y_i(w \cdot \phi(x_i) + b) \geq 1 - \xi_i$

The RBF kernel maps inputs into infinite-dimensional space:
$$K(x_i, x_j) = \exp\left(-\gamma \|x_i - x_j\|^2\right)$$

Setting `probability=True` enables Platt scaling to produce calibrated class probabilities, which are used to derive the 0–100 "readiness score" displayed in the UI.

**Evaluation Metrics (stored and returned):**
- **Confusion Matrix** — Raw TP/FP/TN/FN counts per class
- **ROC-AUC** — Area under the Receiver Operating Characteristic curve (One-vs-Rest for multiclass). Target: > 0.75
- **Precision-Recall Curve** — Especially critical for the minority "Burnout Risk" class
- **Classification Report** — Per-class precision, recall, F1-score

**Fallback/Comparison:** Logistic Regression (`LogisticRegression(multi_class='multinomial')`) is trained in parallel to provide a linear baseline. The model with the higher cross-validated ROC-AUC is selected.

---

### 4.4 Phase D — Continuous Expenditure Regression (CO4: Regression & CO5: Ensemble Methods)

**Objective:** Predict the continuous float value of "Active Calories Burned" for the next 24-hour cycle.

**Model: XGBoost Gradient Boosted Trees** — `xgboost.XGBRegressor`  
XGBoost builds an additive ensemble of $M$ weak learners (decision trees):
$$\hat{y} = \sum_{m=1}^{M} f_m(x), \quad f_m \in \mathcal{F}$$

Each tree $f_m$ is fitted to the negative gradient (residuals) of the loss function from the previous iteration:
$$f_m = \arg\min_{f \in \mathcal{F}} \sum_{i=1}^{n} L\left(y_i, \hat{y}_i^{(m-1)} + f(x_i)\right) + \Omega(f)$$

Where $\Omega(f) = \gamma T + \frac{1}{2}\lambda \|w\|^2$ is the regularization term (tree complexity penalty: $T$ = number of leaves, $w$ = leaf weights).

**Hyperparameter Tuning (CO5)** — `sklearn.model_selection.GridSearchCV`  
Systematic exhaustive search over a pre-defined parameter grid:

| Parameter | Search Space |
|---|---|
| `n_estimators` | [100, 200, 500] |
| `max_depth` | [3, 5, 7] |
| `learning_rate` | [0.01, 0.05, 0.1] |
| `subsample` | [0.8, 1.0] |
| `colsample_bytree` | [0.8, 1.0] |

Cross-validation folds: 5-fold stratified (or standard KFold for regression).

**Evaluation Metrics (stored and returned):**
- **MAE** — $\frac{1}{n}\sum|y_i - \hat{y}_i|$
- **RMSE** — $\sqrt{\frac{1}{n}\sum(y_i - \hat{y}_i)^2}$
- **R² Score** — $1 - \frac{\sum(y_i - \hat{y}_i)^2}{\sum(y_i - \bar{y})^2}$
- **Residual Plot** — Visual diagnostic of prediction errors vs. fitted values (generated during training, saved as image artifact)

---

### 4.5 Phase E — Unsupervised Biometric Archetyping (CO6: Clustering)

**Objective:** Discover latent behavioral clusters in the historical data without supervision.

**Model: K-Means** — `sklearn.cluster.KMeans`  
K-Means partitions $n$ observations into $k$ clusters by minimizing within-cluster sum of squares (WCSS / inertia):
$$J = \sum_{j=1}^{k} \sum_{x_i \in C_j} \|x_i - \mu_j\|^2$$

The algorithm iterates between:
1. **Assignment step:** $C_j = \{x_i : \|x_i - \mu_j\| \leq \|x_i - \mu_l\|, \forall l \neq j\}$
2. **Update step:** $\mu_j = \frac{1}{|C_j|}\sum_{x_i \in C_j} x_i$

**Optimal $k$ Determination:**
- **Elbow Method** — Plot $J$ vs. $k$ for $k \in [2, 10]$. The inflection point ("elbow") indicates diminishing returns.
- **Silhouette Score** — For each sample $i$, compute:
  $$s(i) = \frac{b(i) - a(i)}{\max(a(i), b(i))}$$
  Where $a(i)$ is the mean intra-cluster distance and $b(i)$ is the mean nearest-cluster distance. Target: mean $s > 0.5$.
- **Davies-Bouldin Index** — Lower is better; measures average similarity between each cluster and its most similar neighbor.

**Cluster Label Mapping:**  
After K-Means converges, each cluster centroid is inspected to assign a human-readable archetype:

| Centroid Profile | Archetype Label |
|---|---|
| High steps, high active mins, normal HR | "Active Performer" |
| Low sleep, high stress, elevated RHR | "High Strain" |
| High HRV, adequate sleep, low stress | "Well Recovered" |

During inference, the new user input vector is assigned to the nearest centroid via `kmeans.predict()`.

---

## 5. Model Persistence & Inference Architecture

### 5.1 Training Phase (Offline, One-Time)

A standalone `train.py` script:
1. Loads the synthetic/curated CSV dataset
2. Executes Phases A–E sequentially
3. Serializes all fitted objects via `joblib.dump()`:
   - `preprocessing_pipeline.pkl` — Imputer + Scaler + VarianceThreshold + PCA
   - `classifier_model.pkl` — Fitted SVM (or LR)
   - `regressor_model.pkl` — Fitted XGBoost with best GridSearch params
   - `clusterer_model.pkl` — Fitted KMeans
   - `training_metrics.json` — All evaluation metrics (ROC-AUC, RMSE, Silhouette, etc.)

### 5.2 Inference Phase (Online, Per-Request)

At FastAPI server startup (`lifespan` event):
1. Load all `.pkl` files into memory
2. Load `training_metrics.json`

Per API request:
1. Validate input → Pydantic
2. Transform input → `preprocessing_pipeline.transform(X_input)`
3. Classify → `classifier_model.predict(X_transformed)` + `predict_proba()`
4. Regress → `regressor_model.predict(X_transformed)`
5. Cluster → `clusterer_model.predict(X_transformed)`
6. Assemble response JSON → Return

**Latency Target:** Steps 2–5 operate on a single row of pre-loaded sklearn estimators. Expected inference time: < 50ms.

---

## 6. Network & CORS Configuration

| Setting | Value |
|---|---|
| FastAPI host | `0.0.0.0:8000` |
| Next.js dev server | `localhost:3000` |
| CORS allowed origins | `http://localhost:3000` |
| API route prefix | `/api/v1` |
| Key endpoint | `POST /api/v1/predict` |
| Health check | `GET /api/v1/health` |

---

## 7. Error Handling & Edge-Case Resilience

| Scenario | Handling |
|---|---|
| Missing fields in JSON | Pydantic raises `422` with field-level error messages |
| Extreme values (50,000 steps) | Accepted — StandardScaler handles outliers via z-scoring; models are trained on wide ranges |
| Dimensionality mismatch (fewer features than training) | Pydantic enforces all required fields; PCA transform expects fixed input shape |
| Model file not found at startup | FastAPI raises a clear startup error, prevents server from serving requests |
| Inference numerical error | Try/except block returns `500` with a sanitized error message |

---

## 8. Syllabus Compliance Matrix — Summary

| Course Outcome | Pipeline Phase | Scikit-learn / XGBoost Method | Deliverable |
|---|---|---|---|
| **CO1** — Data Pre-processing | Phase A | `SimpleImputer`, `StandardScaler`, `SMOTE` | Clean feature matrix; class-balanced training set |
| **CO2** — Feature Engineering | Phase B | `VarianceThreshold`, `PCA` | Reduced-dimensionality matrix; explained variance report |
| **CO3** — Classification | Phase C | `SVC(kernel='rbf')`, `LogisticRegression` | Readiness state label; ROC-AUC, confusion matrix |
| **CO4** — Regression | Phase D | `XGBRegressor` | Predicted calories; MAE, RMSE, R² |
| **CO5** — Ensemble & Tuning | Phase D | `GridSearchCV` over XGBoost params | Best hyperparams; CV results table |
| **CO6** — Clustering | Phase E | `KMeans`, `silhouette_score`, `davies_bouldin_score` | Cluster assignment; elbow plot, silhouette score |
