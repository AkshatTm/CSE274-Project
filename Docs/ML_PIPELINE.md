# ML Pipeline Documentation

**BioSync Machine Learning Pipeline** — Scikit-learn 1.8 · XGBoost · K-Means · SMOTE

This document covers the complete machine learning lifecycle: dataset, preprocessing, model design, training, evaluation, and retraining.

---

## Table of Contents

- [Dataset](#dataset)
- [Feature Set](#feature-set)
- [Preprocessing Pipeline](#preprocessing-pipeline)
- [Model 1 — Readiness Classifier (CO3)](#model-1--readiness-classifier)
- [Model 2 — Energy Expenditure Regressor (CO4, CO5)](#model-2--energy-expenditure-regressor)
- [Model 3 — Biometric Clusterer (CO6)](#model-3--biometric-clusterer)
- [Artifact Files](#artifact-files)
- [Retraining Guide](#retraining-guide)
- [Evaluation Targets](#evaluation-targets)

---

## Dataset

| Property | Value |
|---|---|
| Source | Synthetic (`ml/generate_data.py`) |
| Rows | 2,000 records |
| Format | CSV (`ml/data/biometric_data.csv`) |
| Features | 10 biometric signals |
| Classification target | `readiness_label` (3 classes) |
| Regression target | `active_calories` (continuous, kcal) |

The synthetic data generator creates statistically realistic biometric profiles by sampling from Gaussian distributions parameterised by literature-based physiological ranges, then applying domain-grounded label assignment rules.

**Class distribution (approximate):**

| Label | Proportion |
|---|---|
| `Optimal Readiness` | ~40% |
| `Moderate Strain` | ~40% |
| `High Risk of Burnout` | ~20% |

SMOTE oversampling is applied during training to handle the minority class imbalance.

---

## Feature Set

All 10 features are numeric scalars representing a single-day snapshot:

| Feature | Unit | Physiological Role |
|---|---|---|
| `resting_heart_rate` | bpm | Autonomic nervous system recovery indicator |
| `hrv_ms` | ms (RMSSD) | Parasympathetic tone; primary recovery signal |
| `sleep_hours` | hours | Total sleep duration |
| `deep_sleep_pct` | % | Slow-wave sleep proportion; physical recovery |
| `rem_sleep_pct` | % | REM proportion; cognitive and emotional restoration |
| `steps` | count | Total daily locomotion |
| `active_minutes` | min | Purposeful exercise time |
| `stress_score` | 0–100 | Device-derived or self-reported stress index |
| `spo2_pct` | % | Blood oxygen saturation; altitude / recovery indicator |
| `body_temp_deviation` | °C | Deviation from personal baseline; illness signal |

---

## Preprocessing Pipeline

The preprocessing pipeline is a scikit-learn `Pipeline` object serialised to `artifacts/preprocessing_pipeline.pkl`. It is **fitted once on the training set** and applied identically at inference time.

```
Raw Input (10 features)
        │
        ▼
┌──────────────────────────────────────┐
│  Step 1: SimpleImputer               │
│  strategy='median'                   │
│  Handles missing / NaN values        │
└──────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────┐
│  Step 2: StandardScaler              │
│  mean=0, std=1 normalisation         │
│  Required for SVM distance kernel    │
└──────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────┐
│  Step 3: VarianceThreshold           │
│  threshold=0.01                      │
│  Drops near-zero-variance features   │
└──────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────┐
│  Step 4: PCA                         │
│  n_components=0.95 (95% variance)    │
│  Dimensionality reduction            │
│  random_state=42                     │
└──────────────────────────────────────┘
        │
        ▼
  Transformed Feature Vector
  (k ≤ 10 principal components)
```

**Design rationale:**
- **Median imputation** is robust to outliers in biometric data (preferred over mean).
- **StandardScaler** is mandatory for SVM (RBF kernel) which is sensitive to feature magnitude.
- **VarianceThreshold** removes degenerate features (though unlikely with this feature set, it future-proofs against dataset extensions).
- **PCA at 95%** reduces noise and collinearity (e.g., deep sleep % and REM % are correlated) while retaining nearly all predictive information.

---

## Model 1 — Readiness Classifier

**Task:** 3-class classification  
**Target:** `readiness_label` ∈ {`Optimal Readiness`, `Moderate Strain`, `High Risk of Burnout`}

### Model Selection

Two classifiers are trained and compared on held-out test data (80/20 stratified split). The model with higher **weighted OVR ROC-AUC** is saved:

| Candidate | Kernel / Solver | Class Weights |
|---|---|---|
| **SVM** | RBF | `balanced` |
| Logistic Regression | `lbfgs`, max_iter=1000 | `balanced` |

```python
svm_clf = SVC(kernel='rbf', probability=True, random_state=42, class_weight='balanced')
lr_clf  = LogisticRegression(solver='lbfgs', max_iter=1000, random_state=42, class_weight='balanced')

# Whichever gets higher weighted OVR ROC-AUC is saved as classifier_model.pkl
```

### Class Imbalance Handling

SMOTE (Synthetic Minority Oversampling Technique) is applied **after the train/test split** on the training set only:

```python
smote = SMOTE(random_state=42)
X_train_resampled, y_train_resampled = smote.fit_resample(X_train, y_train)
```

This prevents data leakage — test set class distribution remains unchanged.

### Evaluation Metrics

| Metric | How It's Computed | Target |
|---|---|---|
| **ROC-AUC** | Weighted OVR (`roc_auc_score(..., multi_class='ovr', average='weighted')`) | > 0.75 |
| **Precision / Recall / F1** | `classification_report` per class | — |
| **Confusion Matrix** | `confusion_matrix` with `labels=classes` | — |

### Inference

```python
readiness_label = classifier.predict(X_transformed)[0]
readiness_proba = classifier.predict_proba(X_transformed)[0]
readiness_score = round(float(np.max(readiness_proba)) * 100, 1)
# Score represents the model's confidence (0–100)
```

---

## Model 2 — Energy Expenditure Regressor

**Task:** Continuous regression  
**Target:** `active_calories` (kilocalories burned, continuous)

### Model

**XGBoost Gradient Boosted Trees** (`XGBRegressor`) with exhaustive `GridSearchCV` hyperparameter tuning.

### Hyperparameter Search Space

| Parameter | Values Searched |
|---|---|
| `n_estimators` | 100, 200, 500 |
| `max_depth` | 3, 5, 7 |
| `learning_rate` | 0.01, 0.05, 0.1 |
| `subsample` | 0.8, 1.0 |
| `colsample_bytree` | 0.8, 1.0 |

**Grid size:** 3 × 3 × 3 × 2 × 2 = **108 combinations**  
**CV strategy:** 5-fold cross-validation  
**Scoring:** `neg_mean_squared_error`  
**Refit:** `True` (best estimator trained on full training set)

```python
grid_search = GridSearchCV(
    estimator=XGBRegressor(random_state=42, n_jobs=-1),
    param_grid=param_grid,
    cv=5,
    scoring='neg_mean_squared_error',
    n_jobs=-1,
    refit=True,
)
```

### Evaluation Metrics

| Metric | Description | Target |
|---|---|---|
| **MAE** | Mean Absolute Error (kcal) | — |
| **RMSE** | Root Mean Squared Error (kcal) | < 60 kcal |
| **R²** | Explained variance ratio | > 0.85 |

### Inference

```python
predicted_calories = float(regressor.predict(X_transformed)[0])
predicted_calories = round(max(0, predicted_calories), 1)  # Clip negative outputs
```

---

## Model 3 — Biometric Clusterer

**Task:** Unsupervised biometric profiling  
**Algorithm:** K-Means

### Optimal K Selection

K-Means is trained for k ∈ {2, …, 10}. The optimal k is selected by maximising the **Silhouette Score**:

```python
K_RANGE = range(2, 11)
sil_scores = []

for k in K_RANGE:
    km = KMeans(n_clusters=k, random_state=42, n_init=10)
    labels = km.fit_predict(X_transformed)
    sil_scores.append(silhouette_score(X_transformed, labels))

best_k = list(K_RANGE)[np.argmax(sil_scores)]
```

### Cluster Auto-Labeling

After training, each cluster centroid is characterised by its mean feature values in the **original (pre-PCA) space**. Labels are assigned via domain heuristics:

```python
if mean_hrv > 60 and mean_sleep > 7:
    label = "Well Recovered"
elif mean_stress > 60:
    label = "High Strain"
else:
    label = "Active Performer"
```

The `cluster_label_map` is persisted in `training_metrics.json` and consumed at inference time.

### Evaluation Metrics

| Metric | Description | Target |
|---|---|---|
| **Silhouette Score** | Cluster cohesion and separation (-1 to 1) | > 0.50 |
| **Davies-Bouldin Index** | Average cluster similarity (lower is better) | < 1.0 |
| **Elbow Inertia** | Within-cluster sum of squares | — (visual check) |

---

## Artifact Files

All artifacts are saved to `backend/ml/artifacts/` and loaded at API startup:

| File | Contents |
|---|---|
| `preprocessing_pipeline.pkl` | Fitted `Pipeline(imputer → scaler → variance_threshold → pca)` |
| `classifier_model.pkl` | Best classifier (SVM or Logistic Regression) |
| `regressor_model.pkl` | Best XGBoost regressor (tuned via GridSearchCV) |
| `clusterer_model.pkl` | Final K-Means model |
| `training_metrics.json` | All evaluation metrics + cluster label map + PCA metadata |

---

## Retraining Guide

To retrain all models from scratch (e.g., after modifying the dataset or feature set):

```bash
cd backend
source .venv/bin/activate   # or .venv\Scripts\activate on Windows

# Regenerate the synthetic dataset (optional)
python -m ml.generate_data

# Run the full training pipeline
python -m ml.train
```

The script will:
1. Load `ml/data/biometric_data.csv`
2. Apply and fit the preprocessing pipeline
3. Train and compare classifier candidates
4. Run GridSearchCV for XGBoost regressor
5. Run elbow + silhouette analysis for K-Means
6. Save all `.pkl` artifacts and `training_metrics.json`

Training output is printed with `[CO1]` through `[CO6]` prefixes aligned to course outcomes.

---

## Evaluation Targets

| Metric | Target | Rationale |
|---|---|---|
| Classifier ROC-AUC | > 0.75 | Acceptable multi-class discrimination |
| Regressor R² | > 0.85 | Strong predictive power on holdout calorie data |
| Regressor RMSE | < 60 kcal | Acceptable prediction error for daily energy |
| Silhouette Score | > 0.50 | Meaningful cluster separation |
| Davies-Bouldin Index | < 1.0 | Good cluster compactness |
