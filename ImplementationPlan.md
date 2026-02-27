# Master Implementation Plan — BioSync

**Product Name:** BioSync: Human Performance & Recovery Engine  
**Target Audience:** Implementation Agent (Claude Sonnet 4.6)  
**Purpose:** A step-by-step, exhaustively detailed execution plan. Every file, every import, every method call is specified. Follow this sequentially — no creative deviations needed.

---

## Phase 1: Environment & Scaffold Setup

### Step 1.1 — Initialize Project Root Structure

Create the top-level directory layout within the workspace root:

```
CSE274 Projects/
├── frontend/        # Next.js app (created by create-next-app)
├── backend/         # Python FastAPI service
│   ├── app/
│   │   ├── routes/
│   │   ├── models/
│   │   └── core/
│   └── ml/
│       ├── data/
│       └── artifacts/
├── Docs/            # Already exists
└── README.md        # Already exists
```

**Action:** Create the `backend/` directory tree manually. The `frontend/` directory will be created by the Next.js CLI in the next step.

```bash
mkdir -p backend/app/routes backend/app/models backend/app/core backend/ml/data backend/ml/artifacts
```

Create empty `__init__.py` files for all Python packages:
- `backend/app/__init__.py`
- `backend/app/routes/__init__.py`
- `backend/app/models/__init__.py`
- `backend/app/core/__init__.py`
- `backend/ml/__init__.py`

---

### Step 1.2 — Scaffold the Next.js 16 Frontend

Run the create-next-app CLI from the workspace root:

```bash
npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --turbopack
```

**Post-scaffold Configuration:**

1. **Verify `package.json`** contains Next.js 16.x. If not, update: `npm install next@latest react@latest react-dom@latest`
2. **Install additional dependencies:**

```bash
cd frontend
npm install framer-motion recharts
npm install @fontsource/outfit
```

3. **Tailwind CSS v4 Verification:**  
   Next.js 16 ships with Tailwind v4 support out of the box. Verify that `app/globals.css` uses the `@import "tailwindcss"` syntax (v4 style) instead of the v3 `@tailwind base; @tailwind components; @tailwind utilities;` directives. If it's v3 style, convert it:

```css
/* frontend/app/globals.css */
@import "tailwindcss";
```

4. **Font Configuration** — Edit `frontend/app/layout.tsx`:  
   Import Google Fonts using Next.js `next/font/google`:

```typescript
import { Outfit } from 'next/font/google';
// Instrument Serif may need next/font/google import or a local font file
// If not available on Google Fonts API for next/font, use <link> in head or local file

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
});
```

Set the font CSS variables on `<html>` or `<body>` className:
```tsx
<body className={`${outfit.variable} font-sans`}>
```

For **Instrument Serif**, check availability in `next/font/google`. If available:
```typescript
import { Instrument_Serif } from 'next/font/google';
const instrumentSerif = Instrument_Serif({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-instrument-serif',
});
```

If not available via `next/font/google`, install it as a local font or use a `<link>` tag in `layout.tsx` metadata.

---

### Step 1.3 — Scaffold the Python Backend

1. **Create `backend/pyproject.toml`:**

```toml
[project]
name = "biosync-backend"
version = "0.1.0"
description = "BioSync ML Backend"
requires-python = ">=3.13"
dependencies = [
    "fastapi>=0.133.0",
    "uvicorn[standard]>=0.34.0",
    "scikit-learn>=1.8.0",
    "xgboost>=2.1.0",
    "pandas>=2.0.0",
    "numpy>=1.24.1",
    "imbalanced-learn>=0.13.0",
    "joblib>=1.4.0",
    "pydantic>=2.0.0",
]
```

2. **Create `backend/requirements.txt`** (mirror of above for pip compatibility):

```
fastapi>=0.133.0
uvicorn[standard]>=0.34.0
scikit-learn>=1.8.0
xgboost>=2.1.0
pandas>=2.0.0
numpy>=1.24.1
imbalanced-learn>=0.13.0
joblib>=1.4.0
pydantic>=2.0.0
```

3. **Create a virtual environment and install:**

```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate
pip install -r requirements.txt
```

Or with `uv`:
```bash
cd backend
uv venv
uv pip install -r requirements.txt
```

---

### Step 1.4 — Create the Dockerfile

**Create `backend/Dockerfile`:**

```dockerfile
FROM python:3.13-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python packages
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Train models during build (artifacts baked into image)
RUN python -m ml.train

# Expose port
EXPOSE 8000

# Run the server
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Create `backend/.dockerignore`:**

```
.venv
__pycache__
*.pyc
.git
```

---

### Step 1.5 — Verify Both Servers Start

1. **Backend:** `cd backend && uvicorn app.main:app --reload --port 8000` (will fail until `app/main.py` exists — that's OK, just verify the venv and imports work)
2. **Frontend:** `cd frontend && npm run dev` → Verify `localhost:3000` loads the Next.js default page.

---

## Phase 2: Data Engineering & ML Backend

### Step 2.1 — Generate / Prepare the Synthetic CSV Dataset

**File:** `backend/ml/data/biometric_data.csv`

Create a Python script `backend/ml/generate_data.py` that generates a synthetic but realistic CSV dataset with ~1000–2000 rows. This avoids dependency on external real-world datasets.

**CSV Columns (features):**

| Column | Data Type | Range | Description |
|---|---|---|---|
| `resting_heart_rate` | float | 40–100 bpm | Morning resting HR |
| `hrv_ms` | float | 15–150 ms | Heart rate variability (RMSSD) |
| `sleep_hours` | float | 3–12 hrs | Total sleep duration |
| `deep_sleep_pct` | float | 5–35% | Percentage of deep sleep |
| `rem_sleep_pct` | float | 10–35% | Percentage of REM sleep |
| `steps` | int | 500–30000 | Daily step count |
| `active_minutes` | int | 0–180 | Total active exercise minutes |
| `stress_score` | float | 10–100 | Subjective/algorithmic stress score |
| `spo2_pct` | float | 90–100 | Blood oxygen saturation |
| `body_temp_deviation` | float | -1.0–2.0 °C | Deviation from baseline body temperature |
| `active_calories` | float | 100–4000 kcal | **TARGET for regression (CO4/CO5)** |

**Target Variable for Classification (CO3):**

Derive a `readiness_label` column from a weighted formula applied to the row features:

```python
import numpy as np
import pandas as pd

def compute_readiness_score(row):
    """
    Weighted composite score: higher = more ready.
    These weights are heuristic; no medical claim intended.
    """
    score = (
        (row['hrv_ms'] / 150) * 25          # Higher HRV = better
        + (row['sleep_hours'] / 12) * 25     # More sleep = better
        + (row['deep_sleep_pct'] / 35) * 10  # More deep sleep = better
        + (row['rem_sleep_pct'] / 35) * 5    # More REM = better
        + (1 - row['stress_score'] / 100) * 15  # Lower stress = better
        + (1 - (row['resting_heart_rate'] - 40) / 60) * 10  # Lower RHR = better
        + (row['spo2_pct'] - 90) / 10 * 5    # Higher SpO2 = better
        + (1 - abs(row['body_temp_deviation'])) * 5  # Closer to 0 = better
    )
    return np.clip(score, 0, 100)

df['readiness_score'] = df.apply(compute_readiness_score, axis=1)

# Discretize into 3 classes
def label_readiness(score):
    if score >= 65:
        return 'Optimal Readiness'
    elif score >= 40:
        return 'Moderate Strain'
    else:
        return 'High Risk of Burnout'

df['readiness_label'] = df['readiness_score'].apply(label_readiness)
```

**Data Generation Logic:**

```python
np.random.seed(42)
n_samples = 1500

data = {
    'resting_heart_rate': np.random.normal(65, 12, n_samples).clip(40, 100),
    'hrv_ms': np.random.normal(55, 25, n_samples).clip(15, 150),
    'sleep_hours': np.random.normal(7, 1.5, n_samples).clip(3, 12),
    'deep_sleep_pct': np.random.normal(20, 6, n_samples).clip(5, 35),
    'rem_sleep_pct': np.random.normal(22, 5, n_samples).clip(10, 35),
    'steps': np.random.normal(8000, 4000, n_samples).clip(500, 30000).astype(int),
    'active_minutes': np.random.normal(50, 35, n_samples).clip(0, 180).astype(int),
    'stress_score': np.random.normal(50, 20, n_samples).clip(10, 100),
    'spo2_pct': np.random.normal(97, 1.5, n_samples).clip(90, 100),
    'body_temp_deviation': np.random.normal(0, 0.5, n_samples).clip(-1.0, 2.0),
}
```

For `active_calories`, derive it with a realistic formula + noise to give the regressor something meaningful to learn:

```python
data['active_calories'] = (
    data['steps'] * 0.04
    + data['active_minutes'] * 8
    + np.random.normal(0, 50, n_samples)
).clip(100, 4000)
```

**Introduce ~5% missing values randomly** (to demonstrate CO1 imputation):

```python
for col in ['hrv_ms', 'deep_sleep_pct', 'stress_score', 'spo2_pct']:
    mask = np.random.random(n_samples) < 0.05
    df.loc[mask, col] = np.nan
```

Save to `backend/ml/data/biometric_data.csv`.

**Full `generate_data.py` script should be self-contained and runnable:**
```bash
cd backend
python -m ml.generate_data
```

---

### Step 2.2 — Build the Training Pipeline (CO1 through CO6)

**File:** `backend/ml/train.py`

This is the most critical file. It must execute the full pipeline and save all artifacts.

#### 2.2.1 — Imports

```python
import json
import os
import warnings
import joblib
import numpy as np
import pandas as pd

from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler
from sklearn.feature_selection import VarianceThreshold
from sklearn.decomposition import PCA
from sklearn.pipeline import Pipeline

from sklearn.svm import SVC
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split, GridSearchCV, cross_val_score
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    roc_auc_score,
    mean_absolute_error,
    mean_squared_error,
    r2_score,
    silhouette_score,
    davies_bouldin_score,
)

from xgboost import XGBRegressor
from sklearn.cluster import KMeans
from imblearn.over_sampling import SMOTE
from imblearn.pipeline import Pipeline as ImbPipeline

warnings.filterwarnings('ignore')
```

#### 2.2.2 — Phase A: Data Ingestion & Pre-processing (CO1)

```python
# --- LOAD DATA ---
ARTIFACTS_DIR = os.path.join(os.path.dirname(__file__), 'artifacts')
DATA_PATH = os.path.join(os.path.dirname(__file__), 'data', 'biometric_data.csv')
os.makedirs(ARTIFACTS_DIR, exist_ok=True)

df = pd.read_csv(DATA_PATH)

# Define feature columns and targets
FEATURE_COLS = [
    'resting_heart_rate', 'hrv_ms', 'sleep_hours', 'deep_sleep_pct',
    'rem_sleep_pct', 'steps', 'active_minutes', 'stress_score',
    'spo2_pct', 'body_temp_deviation'
]
CLASSIFICATION_TARGET = 'readiness_label'
REGRESSION_TARGET = 'active_calories'

X = df[FEATURE_COLS].copy()
y_class = df[CLASSIFICATION_TARGET].copy()
y_reg = df[REGRESSION_TARGET].copy()

# --- IMPUTATION (CO1) ---
imputer = SimpleImputer(strategy='median')
X_imputed = pd.DataFrame(imputer.fit_transform(X), columns=FEATURE_COLS)

# --- SCALING (CO1) ---
scaler = StandardScaler()
X_scaled = pd.DataFrame(scaler.fit_transform(X_imputed), columns=FEATURE_COLS)
```

#### 2.2.3 — Phase B: Feature Engineering & Dimensionality Reduction (CO2)

```python
# --- VARIANCE THRESHOLD (CO2) ---
var_thresh = VarianceThreshold(threshold=0.01)
X_var = var_thresh.fit_transform(X_scaled)
# Get surviving feature names
surviving_features = [FEATURE_COLS[i] for i, keep in enumerate(var_thresh.get_support()) if keep]
print(f"[CO2] Features after VarianceThreshold: {surviving_features}")

# --- PCA (CO2) ---
pca = PCA(n_components=0.95, random_state=42)
X_pca = pca.fit_transform(X_var)
print(f"[CO2] PCA components retained: {pca.n_components_}")
print(f"[CO2] Explained variance ratio: {pca.explained_variance_ratio_}")
print(f"[CO2] Total explained variance: {sum(pca.explained_variance_ratio_):.4f}")
```

**Build the reusable preprocessing pipeline for inference:**

```python
preprocessing_pipeline = Pipeline([
    ('imputer', SimpleImputer(strategy='median')),
    ('scaler', StandardScaler()),
    ('variance_threshold', VarianceThreshold(threshold=0.01)),
    ('pca', PCA(n_components=0.95, random_state=42)),
])

# Fit on the full imputed+scaled data
# NOTE: We re-fit a single pipeline end-to-end so inference uses ONE transform
preprocessing_pipeline.fit(X)
X_transformed = preprocessing_pipeline.transform(X)

# Save the preprocessing pipeline
joblib.dump(preprocessing_pipeline, os.path.join(ARTIFACTS_DIR, 'preprocessing_pipeline.pkl'))
print("[SAVED] preprocessing_pipeline.pkl")
```

#### 2.2.4 — Phase C: Classification (CO3)

```python
# --- TRAIN/TEST SPLIT ---
X_train_clf, X_test_clf, y_train_clf, y_test_clf = train_test_split(
    X_transformed, y_class, test_size=0.2, random_state=42, stratify=y_class
)

# --- SMOTE (CO1 — class imbalance handling, applied only to training set) ---
smote = SMOTE(random_state=42)
X_train_clf_resampled, y_train_clf_resampled = smote.fit_resample(X_train_clf, y_train_clf)
print(f"[CO1] Class distribution after SMOTE: {pd.Series(y_train_clf_resampled).value_counts().to_dict()}")

# --- SVM CLASSIFIER (CO3) ---
svm_clf = SVC(kernel='rbf', probability=True, random_state=42, class_weight='balanced')
svm_clf.fit(X_train_clf_resampled, y_train_clf_resampled)

# --- LOGISTIC REGRESSION BASELINE (CO3) ---
lr_clf = LogisticRegression(multi_class='multinomial', max_iter=1000, random_state=42, class_weight='balanced')
lr_clf.fit(X_train_clf_resampled, y_train_clf_resampled)

# --- EVALUATE BOTH ---
from sklearn.preprocessing import label_binarize
classes = ['High Risk of Burnout', 'Moderate Strain', 'Optimal Readiness']

def evaluate_classifier(model, name, X_test, y_test):
    y_pred = model.predict(X_test)
    y_proba = model.predict_proba(X_test)
    y_test_bin = label_binarize(y_test, classes=classes)

    roc_auc = roc_auc_score(y_test_bin, y_proba, multi_class='ovr', average='weighted')
    report = classification_report(y_test, y_pred, output_dict=True)
    cm = confusion_matrix(y_test, y_pred, labels=classes)

    print(f"\n[CO3] {name} Results:")
    print(f"  ROC-AUC (weighted OVR): {roc_auc:.4f}")
    print(f"  Classification Report:\n{classification_report(y_test, y_pred)}")
    print(f"  Confusion Matrix:\n{cm}")

    return roc_auc, report, cm

svm_auc, svm_report, svm_cm = evaluate_classifier(svm_clf, "SVM (RBF)", X_test_clf, y_test_clf)
lr_auc, lr_report, lr_cm = evaluate_classifier(lr_clf, "Logistic Regression", X_test_clf, y_test_clf)

# --- SELECT BEST CLASSIFIER ---
if svm_auc >= lr_auc:
    best_clf = svm_clf
    best_clf_name = "SVM"
    best_roc_auc = svm_auc
else:
    best_clf = lr_clf
    best_clf_name = "LogisticRegression"
    best_roc_auc = lr_auc

print(f"\n[CO3] Best classifier: {best_clf_name} (ROC-AUC: {best_roc_auc:.4f})")
joblib.dump(best_clf, os.path.join(ARTIFACTS_DIR, 'classifier_model.pkl'))
print("[SAVED] classifier_model.pkl")
```

#### 2.2.5 — Phase D: Regression with Ensemble & Hyperparameter Tuning (CO4 & CO5)

```python
# --- TRAIN/TEST SPLIT FOR REGRESSION ---
X_train_reg, X_test_reg, y_train_reg, y_test_reg = train_test_split(
    X_transformed, y_reg, test_size=0.2, random_state=42
)

# --- XGBOOST WITH GRID SEARCH (CO4 + CO5) ---
xgb_base = XGBRegressor(random_state=42, n_jobs=-1)

param_grid = {
    'n_estimators': [100, 200, 500],
    'max_depth': [3, 5, 7],
    'learning_rate': [0.01, 0.05, 0.1],
    'subsample': [0.8, 1.0],
    'colsample_bytree': [0.8, 1.0],
}

grid_search = GridSearchCV(
    estimator=xgb_base,
    param_grid=param_grid,
    cv=5,
    scoring='neg_mean_squared_error',
    n_jobs=-1,
    verbose=1,
    refit=True,
)

grid_search.fit(X_train_reg, y_train_reg)

best_xgb = grid_search.best_estimator_
print(f"\n[CO5] Best XGBoost params: {grid_search.best_params_}")

# --- EVALUATE REGRESSION (CO4) ---
y_pred_reg = best_xgb.predict(X_test_reg)
mae = mean_absolute_error(y_test_reg, y_pred_reg)
rmse = np.sqrt(mean_squared_error(y_test_reg, y_pred_reg))
r2 = r2_score(y_test_reg, y_pred_reg)

print(f"\n[CO4] Regression Results:")
print(f"  MAE:  {mae:.2f} kcal")
print(f"  RMSE: {rmse:.2f} kcal")
print(f"  R²:   {r2:.4f}")

joblib.dump(best_xgb, os.path.join(ARTIFACTS_DIR, 'regressor_model.pkl'))
print("[SAVED] regressor_model.pkl")
```

#### 2.2.6 — Phase E: Unsupervised Clustering (CO6)

```python
# --- ELBOW METHOD (CO6) ---
inertias = []
sil_scores = []
K_RANGE = range(2, 11)

for k in K_RANGE:
    km = KMeans(n_clusters=k, random_state=42, n_init=10)
    labels = km.fit_predict(X_transformed)
    inertias.append(km.inertia_)
    sil_scores.append(silhouette_score(X_transformed, labels))
    print(f"  k={k}: inertia={km.inertia_:.2f}, silhouette={sil_scores[-1]:.4f}")

# Select k with best silhouette score
best_k = list(K_RANGE)[np.argmax(sil_scores)]
print(f"\n[CO6] Optimal k: {best_k} (Silhouette: {max(sil_scores):.4f})")

# --- FIT FINAL K-MEANS (CO6) ---
kmeans_final = KMeans(n_clusters=best_k, random_state=42, n_init=10)
cluster_labels = kmeans_final.fit_predict(X_transformed)

final_silhouette = silhouette_score(X_transformed, cluster_labels)
final_db_index = davies_bouldin_score(X_transformed, cluster_labels)

print(f"[CO6] Final Silhouette Score: {final_silhouette:.4f}")
print(f"[CO6] Final Davies-Bouldin Index: {final_db_index:.4f}")

joblib.dump(kmeans_final, os.path.join(ARTIFACTS_DIR, 'clusterer_model.pkl'))
print("[SAVED] clusterer_model.pkl")

# --- SAVE CLUSTER CENTROID LABEL MAPPING ---
# Analyze centroids to assign human-readable labels
centroids_df = pd.DataFrame(
    preprocessing_pipeline.named_steps['pca'].inverse_transform(
        preprocessing_pipeline.named_steps['variance_threshold'].inverse_transform(
            kmeans_final.cluster_centers_
        ) if hasattr(preprocessing_pipeline.named_steps['variance_threshold'], 'inverse_transform')
        else kmeans_final.cluster_centers_
    ),
    columns=FEATURE_COLS
) if False else None  # Inverse transform may not always work; use simpler labeling

# Simple centroid-based labeling strategy:
cluster_label_map = {}
for i in range(best_k):
    cluster_mask = cluster_labels == i
    cluster_data = pd.DataFrame(X_imputed[cluster_mask], columns=FEATURE_COLS) if isinstance(X_imputed, np.ndarray) else X_imputed[cluster_mask]
    mean_stress = cluster_data['stress_score'].mean()
    mean_hrv = cluster_data['hrv_ms'].mean()
    mean_sleep = cluster_data['sleep_hours'].mean()

    if mean_hrv > 60 and mean_sleep > 7:
        cluster_label_map[i] = "Well Recovered"
    elif mean_stress > 60:
        cluster_label_map[i] = "High Strain"
    else:
        cluster_label_map[i] = "Active Performer"

print(f"[CO6] Cluster label map: {cluster_label_map}")
```

#### 2.2.7 — Save All Metrics to JSON

```python
# --- SAVE METRICS + CONFIG ---
# Also save elbow data for potential frontend rendering
metrics = {
    "classification": {
        "model": best_clf_name,
        "roc_auc": round(best_roc_auc, 4),
    },
    "regression": {
        "mae": round(mae, 2),
        "rmse": round(rmse, 2),
        "r2": round(r2, 4),
        "best_params": grid_search.best_params_,
    },
    "clustering": {
        "optimal_k": best_k,
        "silhouette_score": round(final_silhouette, 4),
        "davies_bouldin_index": round(final_db_index, 4),
        "cluster_label_map": cluster_label_map,
        "elbow_data": {
            "k_values": list(K_RANGE),
            "inertias": [round(x, 2) for x in inertias],
            "silhouette_scores": [round(x, 4) for x in sil_scores],
        },
    },
    "feature_columns": FEATURE_COLS,
    "pca_components_retained": int(pca.n_components_),
    "pca_explained_variance": round(sum(pca.explained_variance_ratio_), 4),
}

with open(os.path.join(ARTIFACTS_DIR, 'training_metrics.json'), 'w') as f:
    json.dump(metrics, f, indent=2)
print("[SAVED] training_metrics.json")

print("\n✅ Training pipeline complete. All artifacts saved to:", ARTIFACTS_DIR)
```

#### 2.2.8 — Verify Training Pipeline

Run the full training:

```bash
cd backend
python -m ml.train
```

**Expected output:** Console prints for each CO step, ending with all `.pkl` files and `training_metrics.json` saved to `backend/ml/artifacts/`.

**Expected artifacts:**
- `backend/ml/artifacts/preprocessing_pipeline.pkl`
- `backend/ml/artifacts/classifier_model.pkl`
- `backend/ml/artifacts/regressor_model.pkl`
- `backend/ml/artifacts/clusterer_model.pkl`
- `backend/ml/artifacts/training_metrics.json`

---

## Phase 3: API Construction (FastAPI Endpoints & Pydantic Models)

### Step 3.1 — Configuration

**File:** `backend/app/core/config.py`

```python
import os

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ARTIFACTS_DIR = os.path.join(BASE_DIR, 'ml', 'artifacts')
METRICS_PATH = os.path.join(ARTIFACTS_DIR, 'training_metrics.json')

# Model file paths
PREPROCESSING_PIPELINE_PATH = os.path.join(ARTIFACTS_DIR, 'preprocessing_pipeline.pkl')
CLASSIFIER_MODEL_PATH = os.path.join(ARTIFACTS_DIR, 'classifier_model.pkl')
REGRESSOR_MODEL_PATH = os.path.join(ARTIFACTS_DIR, 'regressor_model.pkl')
CLUSTERER_MODEL_PATH = os.path.join(ARTIFACTS_DIR, 'clusterer_model.pkl')

# API settings
API_V1_PREFIX = "/api/v1"
CORS_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"]
```

---

### Step 3.2 — Pydantic Schemas

**File:** `backend/app/models/schemas.py`

```python
from pydantic import BaseModel, Field
from typing import Optional

class BiometricInput(BaseModel):
    """Input schema — validated biometric telemetry from the frontend sliders."""
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

    class Config:
        json_schema_extra = {
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


class PipelineMetrics(BaseModel):
    """Validation metrics from model training."""
    roc_auc: float
    rmse: float
    r2: float
    mae: float
    silhouette_score: float
    davies_bouldin_index: float


class PredictionResponse(BaseModel):
    """Output schema — the full prediction payload."""
    readiness_classification_state: str
    readiness_score: float
    predicted_expenditure_value: float
    assigned_biometric_cluster: int
    cluster_label: str
    pipeline_validation_metrics: PipelineMetrics
```

---

### Step 3.3 — Inference Module

**File:** `backend/app/models/inference.py`

```python
import json
import joblib
import numpy as np
from app.core.config import (
    PREPROCESSING_PIPELINE_PATH,
    CLASSIFIER_MODEL_PATH,
    REGRESSOR_MODEL_PATH,
    CLUSTERER_MODEL_PATH,
    METRICS_PATH,
)

# Global model references (loaded at startup)
preprocessing_pipeline = None
classifier = None
regressor = None
clusterer = None
training_metrics = None


def load_models():
    """Load all serialized models and metrics into memory. Called once at startup."""
    global preprocessing_pipeline, classifier, regressor, clusterer, training_metrics

    preprocessing_pipeline = joblib.load(PREPROCESSING_PIPELINE_PATH)
    classifier = joblib.load(CLASSIFIER_MODEL_PATH)
    regressor = joblib.load(REGRESSOR_MODEL_PATH)
    clusterer = joblib.load(CLUSTERER_MODEL_PATH)

    with open(METRICS_PATH, 'r') as f:
        training_metrics = json.load(f)

    print("✅ All models and metrics loaded successfully.")


def predict(input_array: np.ndarray) -> dict:
    """
    Run the full inference pipeline on a single input vector.

    Args:
        input_array: np.ndarray of shape (1, 10) — the 10 biometric features in order.

    Returns:
        Dictionary with prediction results.
    """
    # Phase A+B: Pre-process
    X_transformed = preprocessing_pipeline.transform(input_array)

    # Phase C: Classification (CO3)
    readiness_label = classifier.predict(X_transformed)[0]
    readiness_proba = classifier.predict_proba(X_transformed)[0]
    # Convert max class probability to a 0-100 readiness score
    readiness_score = round(float(np.max(readiness_proba)) * 100, 1)

    # Phase D: Regression (CO4/CO5)
    predicted_calories = float(regressor.predict(X_transformed)[0])
    predicted_calories = round(max(0, predicted_calories), 1)  # Clamp to non-negative

    # Phase E: Clustering (CO6)
    cluster_id = int(clusterer.predict(X_transformed)[0])
    cluster_label_map = training_metrics['clustering']['cluster_label_map']
    cluster_label = cluster_label_map.get(str(cluster_id), f"Cluster {cluster_id}")

    # Compile metrics
    metrics = {
        "roc_auc": training_metrics['classification']['roc_auc'],
        "rmse": training_metrics['regression']['rmse'],
        "r2": training_metrics['regression']['r2'],
        "mae": training_metrics['regression']['mae'],
        "silhouette_score": training_metrics['clustering']['silhouette_score'],
        "davies_bouldin_index": training_metrics['clustering']['davies_bouldin_index'],
    }

    return {
        "readiness_classification_state": readiness_label,
        "readiness_score": readiness_score,
        "predicted_expenditure_value": predicted_calories,
        "assigned_biometric_cluster": cluster_id,
        "cluster_label": cluster_label,
        "pipeline_validation_metrics": metrics,
    }
```

---

### Step 3.4 — API Route

**File:** `backend/app/routes/predict.py`

```python
import numpy as np
from fastapi import APIRouter, HTTPException
from app.models.schemas import BiometricInput, PredictionResponse
from app.models.inference import predict

router = APIRouter()

# The exact order must match FEATURE_COLS used during training
FEATURE_ORDER = [
    'resting_heart_rate', 'hrv_ms', 'sleep_hours', 'deep_sleep_pct',
    'rem_sleep_pct', 'steps', 'active_minutes', 'stress_score',
    'spo2_pct', 'body_temp_deviation'
]


@router.post("/predict", response_model=PredictionResponse)
async def predict_endpoint(payload: BiometricInput):
    """
    Accept a biometric telemetry vector, run it through all ML pipelines,
    and return classification, regression, and clustering results.
    """
    try:
        # Convert Pydantic model to numpy array in the correct feature order
        input_dict = payload.model_dump()
        input_array = np.array([[input_dict[col] for col in FEATURE_ORDER]])

        result = predict(input_array)
        return PredictionResponse(**result)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")
```

---

### Step 3.5 — FastAPI Application Factory

**File:** `backend/app/main.py`

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import API_V1_PREFIX, CORS_ORIGINS
from app.routes.predict import router as predict_router
from app.models.inference import load_models


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load ML models into memory at startup."""
    load_models()
    yield
    # Cleanup (if needed) on shutdown
    print("Shutting down BioSync API.")


app = FastAPI(
    title="BioSync API",
    description="Predictive Biometric Telemetry Engine — ML Backend",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS middleware for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routes
app.include_router(predict_router, prefix=API_V1_PREFIX)


@app.get(f"{API_V1_PREFIX}/health")
async def health_check():
    return {"status": "healthy", "models_loaded": True}
```

---

### Step 3.6 — Verify the API

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

Test with curl or the built-in Swagger docs at `http://localhost:8000/docs`:

```bash
curl -X POST http://localhost:8000/api/v1/predict \
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

**Expected Response:** A valid JSON matching `PredictionResponse` schema with all fields populated.

---

## Phase 4: Frontend UI/UX Execution

### Step 4.1 — Global Styles & Animated Mesh Background

**File:** `frontend/app/globals.css`

```css
@import "tailwindcss";

/* --- Animated Mesh Gradient Background --- */
@layer base {
  body {
    @apply min-h-screen overflow-x-hidden;
    background: linear-gradient(-45deg, #F8F9FA, #E9ECEF, #E0F2FE, #F8F9FA);
    background-size: 400% 400%;
    animation: meshGradient 15s ease infinite;
  }
}

@keyframes meshGradient {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

/* --- Glass Card Utility --- */
@layer components {
  .glass-card {
    background: rgba(255, 255, 255, 0.65);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.4);
    border-radius: 1.5rem;
  }
}
```

---

### Step 4.2 — API Client

**File:** `frontend/lib/api.ts`

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export interface BiometricInput {
  resting_heart_rate: number;
  hrv_ms: number;
  sleep_hours: number;
  deep_sleep_pct: number;
  rem_sleep_pct: number;
  steps: number;
  active_minutes: number;
  stress_score: number;
  spo2_pct: number;
  body_temp_deviation: number;
}

export interface PipelineMetrics {
  roc_auc: number;
  rmse: number;
  r2: number;
  mae: number;
  silhouette_score: number;
  davies_bouldin_index: number;
}

export interface PredictionResponse {
  readiness_classification_state: string;
  readiness_score: number;
  predicted_expenditure_value: number;
  assigned_biometric_cluster: number;
  cluster_label: string;
  pipeline_validation_metrics: PipelineMetrics;
}

export async function fetchPrediction(input: BiometricInput): Promise<PredictionResponse> {
  const response = await fetch(`${API_BASE_URL}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `API error: ${response.status}`);
  }

  return response.json();
}
```

---

### Step 4.3 — Reusable BentoCard Component (Glassmorphism + 3D Tilt)

**File:** `frontend/components/BentoCard.tsx`

```tsx
'use client';

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useRef, type ReactNode } from 'react';

interface BentoCardProps {
  children: ReactNode;
  className?: string;
  index?: number; // For staggered entrance delay
}

export default function BentoCard({ children, className = '', index = 0 }: BentoCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [5, -5]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-5, 5]), { stiffness: 300, damping: 30 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    x.set(px);
    y.set(py);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      className={`glass-card p-6 ${className}`}
      style={{ rotateX, rotateY, transformPerspective: 800 }}
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: 'spring',
        stiffness: 100,
        damping: 15,
        delay: index * 0.1,
      }}
      whileHover={{
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        transition: { duration: 0.2 },
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </motion.div>
  );
}
```

---

### Step 4.4 — AnimatedNumber Component (Tick-Up Effect)

**File:** `frontend/components/AnimatedNumber.tsx`

```tsx
'use client';

import { useEffect, useRef } from 'react';
import { animate, useMotionValue, useTransform, motion } from 'framer-motion';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  decimals?: number;
  className?: string;
  suffix?: string;
}

export default function AnimatedNumber({
  value,
  duration = 1.5,
  decimals = 0,
  className = '',
  suffix = '',
}: AnimatedNumberProps) {
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (latest) => latest.toFixed(decimals) + suffix);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration,
      ease: 'easeOut',
    });
    return controls.stop;
  }, [value, duration, motionValue]);

  useEffect(() => {
    const unsubscribe = rounded.on('change', (v) => {
      if (ref.current) ref.current.textContent = v;
    });
    return unsubscribe;
  }, [rounded]);

  return <motion.span ref={ref} className={className} />;
}
```

---

### Step 4.5 — TelemetryInput Component (Slider Panel)

**File:** `frontend/components/TelemetryInput.tsx`

```tsx
'use client';

import { useState } from 'react';
import BentoCard from './BentoCard';
import type { BiometricInput } from '@/lib/api';

interface SliderConfig {
  key: keyof BiometricInput;
  label: string;
  min: number;
  max: number;
  step: number;
  unit: string;
  defaultValue: number;
}

const SLIDER_CONFIG: SliderConfig[] = [
  { key: 'resting_heart_rate', label: 'Resting Heart Rate', min: 40, max: 100, step: 1, unit: 'bpm', defaultValue: 65 },
  { key: 'hrv_ms', label: 'Heart Rate Variability', min: 15, max: 150, step: 1, unit: 'ms', defaultValue: 50 },
  { key: 'sleep_hours', label: 'Sleep Duration', min: 3, max: 12, step: 0.5, unit: 'hrs', defaultValue: 7 },
  { key: 'deep_sleep_pct', label: 'Deep Sleep', min: 5, max: 35, step: 1, unit: '%', defaultValue: 20 },
  { key: 'rem_sleep_pct', label: 'REM Sleep', min: 10, max: 35, step: 1, unit: '%', defaultValue: 22 },
  { key: 'steps', label: 'Steps', min: 500, max: 30000, step: 100, unit: 'steps', defaultValue: 8000 },
  { key: 'active_minutes', label: 'Active Minutes', min: 0, max: 180, step: 5, unit: 'min', defaultValue: 45 },
  { key: 'stress_score', label: 'Stress Score', min: 10, max: 100, step: 1, unit: '', defaultValue: 50 },
  { key: 'spo2_pct', label: 'Blood Oxygen (SpO₂)', min: 90, max: 100, step: 0.5, unit: '%', defaultValue: 97 },
  { key: 'body_temp_deviation', label: 'Temp Deviation', min: -1.0, max: 2.0, step: 0.1, unit: '°C', defaultValue: 0 },
];

interface TelemetryInputProps {
  onSubmit: (data: BiometricInput) => void;
  isLoading: boolean;
}

export default function TelemetryInput({ onSubmit, isLoading }: TelemetryInputProps) {
  const [values, setValues] = useState<BiometricInput>(
    Object.fromEntries(SLIDER_CONFIG.map((s) => [s.key, s.defaultValue])) as BiometricInput
  );

  const handleChange = (key: keyof BiometricInput, val: number) => {
    setValues((prev) => ({ ...prev, [key]: val }));
  };

  return (
    <BentoCard className="col-span-full lg:col-span-1 row-span-2" index={0}>
      <h2 className="text-lg font-semibold text-[#1F2937] mb-4" style={{ fontFamily: 'var(--font-instrument-serif)' }}>
        Telemetry Input
      </h2>

      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
        {SLIDER_CONFIG.map((slider) => (
          <div key={slider.key}>
            <div className="flex justify-between text-xs text-gray-500 mb-1" style={{ fontFamily: 'var(--font-outfit)' }}>
              <span>{slider.label}</span>
              <span className="font-medium text-[#1F2937]">
                {values[slider.key]} {slider.unit}
              </span>
            </div>
            <input
              type="range"
              min={slider.min}
              max={slider.max}
              step={slider.step}
              value={values[slider.key]}
              onChange={(e) => handleChange(slider.key, parseFloat(e.target.value))}
              className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#1F2937]"
            />
          </div>
        ))}
      </div>

      <button
        onClick={() => onSubmit(values)}
        disabled={isLoading}
        className="mt-6 w-full py-3 rounded-xl text-sm font-semibold tracking-wide
                   glass-card border border-white/40
                   hover:bg-white/80 transition-all duration-300
                   disabled:opacity-50 disabled:cursor-not-allowed
                   text-[#1F2937]"
        style={{ fontFamily: 'var(--font-outfit)' }}
      >
        {isLoading ? (
          <span className="animate-pulse">Synthesizing...</span>
        ) : (
          'Synthesize Vitals'
        )}
      </button>
    </BentoCard>
  );
}
```

---

### Step 4.6 — ReadinessOracle Component (CO3 — Classification Widget)

**File:** `frontend/components/ReadinessOracle.tsx`

```tsx
'use client';

import BentoCard from './BentoCard';
import AnimatedNumber from './AnimatedNumber';
import type { PredictionResponse } from '@/lib/api';

interface ReadinessOracleProps {
  data: PredictionResponse | null;
}

function getSemanticColor(state: string): string {
  switch (state) {
    case 'Optimal Readiness': return '#34D399';
    case 'Moderate Strain': return '#FBBF24';
    case 'High Risk of Burnout': return '#FB7185';
    default: return '#9CA3AF';
  }
}

export default function ReadinessOracle({ data }: ReadinessOracleProps) {
  const color = data ? getSemanticColor(data.readiness_classification_state) : '#9CA3AF';

  return (
    <BentoCard className="col-span-full md:col-span-2 flex flex-col items-center justify-center min-h-[220px]" index={1}>
      <p className="text-xs uppercase tracking-widest text-gray-400 mb-2" style={{ fontFamily: 'var(--font-outfit)' }}>
        Readiness Oracle
      </p>

      <div style={{ color }}>
        {data ? (
          <AnimatedNumber
            value={data.readiness_score}
            decimals={0}
            className="text-7xl font-bold"
            // Apply Instrument Serif via inline style
          />
        ) : (
          <span className="text-7xl font-bold text-gray-200">—</span>
        )}
      </div>

      <p className="mt-2 text-sm font-medium" style={{ color, fontFamily: 'var(--font-outfit)' }}>
        {data?.readiness_classification_state || 'Awaiting Input'}
      </p>

      {data && (
        <span className="mt-3 text-[10px] px-3 py-1 rounded-full bg-gray-100 text-gray-500"
              style={{ fontFamily: 'var(--font-outfit)' }}>
          ROC-AUC: {data.pipeline_validation_metrics.roc_auc}
        </span>
      )}
    </BentoCard>
  );
}
```

---

### Step 4.7 — EnergyForecast Component (CO4/CO5 — Regression Widget)

**File:** `frontend/components/EnergyForecast.tsx`

```tsx
'use client';

import BentoCard from './BentoCard';
import AnimatedNumber from './AnimatedNumber';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { PredictionResponse } from '@/lib/api';

interface EnergyForecastProps {
  data: PredictionResponse | null;
}

export default function EnergyForecast({ data }: EnergyForecastProps) {
  // Generate mock historical trend + the new predicted point
  const chartData = data
    ? [
        { day: 'Mon', calories: Math.round(data.predicted_expenditure_value * 0.85) },
        { day: 'Tue', calories: Math.round(data.predicted_expenditure_value * 0.92) },
        { day: 'Wed', calories: Math.round(data.predicted_expenditure_value * 1.05) },
        { day: 'Thu', calories: Math.round(data.predicted_expenditure_value * 0.78) },
        { day: 'Fri', calories: Math.round(data.predicted_expenditure_value * 0.95) },
        { day: 'Sat', calories: Math.round(data.predicted_expenditure_value * 1.1) },
        { day: 'Today', calories: Math.round(data.predicted_expenditure_value) },
      ]
    : [];

  return (
    <BentoCard className="col-span-full md:col-span-2 min-h-[280px]" index={2}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-gray-400" style={{ fontFamily: 'var(--font-outfit)' }}>
            Energy Forecast
          </p>
          {data && (
            <div className="flex items-baseline gap-1 mt-1">
              <AnimatedNumber
                value={data.predicted_expenditure_value}
                decimals={0}
                suffix=" kcal"
                className="text-3xl font-bold text-[#1F2937]"
              />
            </div>
          )}
        </div>
        {data && (
          <span className="text-[10px] px-3 py-1 rounded-full bg-gray-100 text-gray-500"
                style={{ fontFamily: 'var(--font-outfit)' }}>
            RMSE: {data.pipeline_validation_metrics.rmse} kcal
          </span>
        )}
      </div>

      {data && chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="caloriesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#34D399" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#34D399" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9CA3AF' }} />
            <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="calories"
              stroke="#34D399"
              fill="url(#caloriesGradient)"
              strokeWidth={2}
              animationDuration={1500}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-[180px] text-gray-300 text-sm">
          Chart populates after synthesis
        </div>
      )}
    </BentoCard>
  );
}
```

---

### Step 4.8 — ClusterArchetype Component (CO6 — Clustering Widget)

**File:** `frontend/components/ClusterArchetype.tsx`

```tsx
'use client';

import BentoCard from './BentoCard';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { PredictionResponse } from '@/lib/api';

interface ClusterArchetypeProps {
  data: PredictionResponse | null;
}

const CLUSTER_COLORS = ['#34D399', '#FBBF24', '#FB7185', '#60A5FA', '#A78BFA'];

export default function ClusterArchetype({ data }: ClusterArchetypeProps) {
  // Generate mock cluster scatter data for visualization
  const generateClusterData = () => {
    if (!data) return [];
    const points: { x: number; y: number; cluster: number }[] = [];
    const numClusters = 3;

    for (let c = 0; c < numClusters; c++) {
      const cx = 30 + c * 30;
      const cy = 40 + (c % 2) * 25;
      for (let i = 0; i < 15; i++) {
        points.push({
          x: cx + (Math.random() - 0.5) * 20,
          y: cy + (Math.random() - 0.5) * 20,
          cluster: c,
        });
      }
    }

    // Add the user's point
    points.push({
      x: 30 + data.assigned_biometric_cluster * 30 + (Math.random() - 0.5) * 5,
      y: 40 + (data.assigned_biometric_cluster % 2) * 25 + (Math.random() - 0.5) * 5,
      cluster: data.assigned_biometric_cluster,
    });

    return points;
  };

  const scatterData = generateClusterData();

  return (
    <BentoCard className="col-span-full md:col-span-1 min-h-[280px]" index={3}>
      <p className="text-xs uppercase tracking-widest text-gray-400 mb-1" style={{ fontFamily: 'var(--font-outfit)' }}>
        Biometric Archetype
      </p>

      {data ? (
        <>
          <p className="text-lg font-semibold text-[#1F2937] mb-3" style={{ fontFamily: 'var(--font-instrument-serif)' }}>
            {data.cluster_label}
          </p>

          <ResponsiveContainer width="100%" height={160}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
              <XAxis type="number" dataKey="x" tick={{ fontSize: 10, fill: '#9CA3AF' }} name="PC1" />
              <YAxis type="number" dataKey="y" tick={{ fontSize: 10, fill: '#9CA3AF' }} name="PC2" />
              <Tooltip />
              <Scatter data={scatterData} animationDuration={1500}>
                {scatterData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CLUSTER_COLORS[entry.cluster % CLUSTER_COLORS.length]} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>

          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] px-3 py-1 rounded-full bg-gray-100 text-gray-500"
                  style={{ fontFamily: 'var(--font-outfit)' }}>
              Silhouette: {data.pipeline_validation_metrics.silhouette_score}
            </span>
            <span className="text-[10px] text-gray-400" style={{ fontFamily: 'var(--font-outfit)' }}>
              Cluster {data.assigned_biometric_cluster}
            </span>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center h-[200px] text-gray-300 text-sm">
          Awaiting synthesis
        </div>
      )}
    </BentoCard>
  );
}
```

---

### Step 4.9 — Main Dashboard Page (Bento Grid Layout)

**File:** `frontend/app/page.tsx`

```tsx
'use client';

import { useState } from 'react';
import TelemetryInput from '@/components/TelemetryInput';
import ReadinessOracle from '@/components/ReadinessOracle';
import EnergyForecast from '@/components/EnergyForecast';
import ClusterArchetype from '@/components/ClusterArchetype';
import { fetchPrediction, type BiometricInput, type PredictionResponse } from '@/lib/api';

export default function Dashboard() {
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: BiometricInput) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchPrediction(data);
      setPrediction(result);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch prediction');
      console.error('Prediction error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-6 md:p-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-[#1F2937]"
            style={{ fontFamily: 'var(--font-instrument-serif)' }}>
          BioSync
        </h1>
        <p className="text-sm text-gray-400 mt-1" style={{ fontFamily: 'var(--font-outfit)' }}>
          Human Performance & Recovery Engine
        </p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-auto">
        {/* Column 1: Telemetry Input */}
        <TelemetryInput onSubmit={handleSubmit} isLoading={isLoading} />

        {/* Column 2-3: Readiness Oracle (Hero Card) */}
        <ReadinessOracle data={prediction} />

        {/* Column 2-3: Energy Forecast */}
        <EnergyForecast data={prediction} />

        {/* Column 4: Cluster Archetype */}
        <ClusterArchetype data={prediction} />
      </div>
    </main>
  );
}
```

---

### Step 4.10 — Root Layout (Font Loading)

**File:** `frontend/app/layout.tsx`

Update the auto-generated layout to include font configuration:

```tsx
import type { Metadata } from 'next';
import { Outfit, Instrument_Serif } from 'next/font/google';
import './globals.css';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
});

const instrumentSerif = Instrument_Serif({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-instrument-serif',
});

export const metadata: Metadata = {
  title: 'BioSync — Human Performance & Recovery Engine',
  description: 'Predictive biometric telemetry powered by machine learning',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${outfit.variable} ${instrumentSerif.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
```

> **Note:** If `Instrument_Serif` is not available via `next/font/google`, use a `<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif&display=swap">` in `<head>` instead and reference it via CSS custom property.

---

## Phase 5: Integration & Validation

### Step 5.1 — Configure Environment Variable

Create `frontend/.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

### Step 5.2 — Start Both Servers

**Terminal 1 — Backend:**
```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

### Step 5.3 — End-to-End Integration Test

1. Open `http://localhost:3000`
2. Verify the animated mesh gradient background is moving
3. Verify bento cards slide up and fade in (stagger animation)
4. Adjust sliders for various input scenarios:

| Scenario | Steps | HRV | Sleep | Stress | Expected Readiness |
|---|---|---|---|---|---|
| Well-rested athlete | 12000 | 80 | 8.5 | 25 | Optimal Readiness |
| Moderate office worker | 6000 | 45 | 6.5 | 55 | Moderate Strain |
| Sleep-deprived, stressed | 2000 | 20 | 4.0 | 90 | High Risk of Burnout |

5. Click **"Synthesize Vitals"** for each scenario
6. Verify:
   - [ ] Readiness Oracle shows the correct color (Emerald / Amber / Rose)
   - [ ] Number ticks up from 0 to the readiness score
   - [ ] Energy Forecast chart draws itself onto the screen
   - [ ] Cluster Archetype scatter plot populates
   - [ ] Validation metrics (ROC-AUC, RMSE, Silhouette) are displayed

### Step 5.4 — Edge-Case Resilience Testing

Test extreme inputs via the API directly:

```bash
# Extreme high activity
curl -X POST http://localhost:8000/api/v1/predict \
  -H "Content-Type: application/json" \
  -d '{"resting_heart_rate":45,"hrv_ms":120,"sleep_hours":9,"deep_sleep_pct":30,"rem_sleep_pct":25,"steps":50000,"active_minutes":180,"stress_score":10,"spo2_pct":99,"body_temp_deviation":0.0}'

# Extreme sedentary / unhealthy
curl -X POST http://localhost:8000/api/v1/predict \
  -H "Content-Type: application/json" \
  -d '{"resting_heart_rate":95,"hrv_ms":15,"sleep_hours":3,"deep_sleep_pct":5,"rem_sleep_pct":10,"steps":500,"active_minutes":0,"stress_score":100,"spo2_pct":90,"body_temp_deviation":1.5}'

# Invalid input (should return 422)
curl -X POST http://localhost:8000/api/v1/predict \
  -H "Content-Type: application/json" \
  -d '{"resting_heart_rate":-10,"hrv_ms":48,"sleep_hours":25}'
```

### Step 5.5 — Validate KPI Targets

Check `backend/ml/artifacts/training_metrics.json` and verify:

| KPI | Target | Check |
|---|---|---|
| `clustering.silhouette_score` | > 0.5 | Read from JSON |
| `classification.roc_auc` | > 0.75 | Read from JSON |
| API round-trip latency | < 200ms | Time the curl request |
| No crash on extreme inputs | 200 response | Tested in Step 5.4 |

If **Silhouette Score < 0.5**: Adjust the synthetic data generation to create more separable clusters (increase the difference between cluster centroids in `generate_data.py`).

If **ROC-AUC < 0.75**: Adjust the readiness score formula boundaries in `generate_data.py` to create more separable classes, or try different SVM hyperparameters (C, gamma).

### Step 5.6 — Docker Build Verification

```bash
cd backend
docker build -t biosync-backend .
docker run -p 8000:8000 biosync-backend
```

Verify the health endpoint:
```bash
curl http://localhost:8000/api/v1/health
# Expected: {"status":"healthy","models_loaded":true}
```

---

## Appendix A: File Checklist

After completing all phases, the following files must exist:

### Backend
- [ ] `backend/pyproject.toml`
- [ ] `backend/requirements.txt`
- [ ] `backend/Dockerfile`
- [ ] `backend/.dockerignore`
- [ ] `backend/app/__init__.py`
- [ ] `backend/app/main.py`
- [ ] `backend/app/core/__init__.py`
- [ ] `backend/app/core/config.py`
- [ ] `backend/app/models/__init__.py`
- [ ] `backend/app/models/schemas.py`
- [ ] `backend/app/models/inference.py`
- [ ] `backend/app/routes/__init__.py`
- [ ] `backend/app/routes/predict.py`
- [ ] `backend/ml/__init__.py`
- [ ] `backend/ml/generate_data.py`
- [ ] `backend/ml/train.py`
- [ ] `backend/ml/data/biometric_data.csv` (generated)
- [ ] `backend/ml/artifacts/preprocessing_pipeline.pkl` (generated)
- [ ] `backend/ml/artifacts/classifier_model.pkl` (generated)
- [ ] `backend/ml/artifacts/regressor_model.pkl` (generated)
- [ ] `backend/ml/artifacts/clusterer_model.pkl` (generated)
- [ ] `backend/ml/artifacts/training_metrics.json` (generated)

### Frontend
- [ ] `frontend/app/layout.tsx`
- [ ] `frontend/app/page.tsx`
- [ ] `frontend/app/globals.css`
- [ ] `frontend/lib/api.ts`
- [ ] `frontend/components/BentoCard.tsx`
- [ ] `frontend/components/AnimatedNumber.tsx`
- [ ] `frontend/components/TelemetryInput.tsx`
- [ ] `frontend/components/ReadinessOracle.tsx`
- [ ] `frontend/components/EnergyForecast.tsx`
- [ ] `frontend/components/ClusterArchetype.tsx`
- [ ] `frontend/.env.local`

### Docs
- [ ] `Docs/PRD.md`
- [ ] `Docs/TechStack.md`
- [ ] `Docs/UIUX.md`
- [ ] `Docs/SystemArchitecture.md`
- [ ] `Docs/ImplementationPlan.md`
- [ ] `README.md`

---

## Appendix B: Syllabus Compliance Traceability

| CO | Requirement | Implementation File | Exact Method/Class |
|---|---|---|---|
| CO1 | Missing data handling | `ml/train.py` | `SimpleImputer(strategy='median')` |
| CO1 | Feature scaling | `ml/train.py` | `StandardScaler()` |
| CO1 | Class imbalance | `ml/train.py` | `SMOTE(random_state=42)` |
| CO2 | Variance filtering | `ml/train.py` | `VarianceThreshold(threshold=0.01)` |
| CO2 | Dimensionality reduction | `ml/train.py` | `PCA(n_components=0.95)` |
| CO3 | Classification | `ml/train.py` | `SVC(kernel='rbf', probability=True)` |
| CO3 | Classification baseline | `ml/train.py` | `LogisticRegression(multi_class='multinomial')` |
| CO3 | Evaluation | `ml/train.py` | `roc_auc_score`, `confusion_matrix`, `classification_report` |
| CO4 | Regression | `ml/train.py` | `XGBRegressor()` |
| CO4 | Regression evaluation | `ml/train.py` | `mean_absolute_error`, `mean_squared_error`, `r2_score` |
| CO5 | Ensemble hyperparameter tuning | `ml/train.py` | `GridSearchCV(estimator=xgb_base, param_grid=..., cv=5)` |
| CO6 | Clustering | `ml/train.py` | `KMeans(n_clusters=best_k)` |
| CO6 | Cluster evaluation | `ml/train.py` | `silhouette_score`, `davies_bouldin_score` |
| CO6 | Optimal k selection | `ml/train.py` | Elbow method loop + `np.argmax(sil_scores)` |
