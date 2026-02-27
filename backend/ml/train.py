import json
import os
import warnings
import joblib
import numpy as np
import pandas as pd

from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, label_binarize
from sklearn.feature_selection import VarianceThreshold
from sklearn.decomposition import PCA
from sklearn.pipeline import Pipeline

from sklearn.svm import SVC
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split, GridSearchCV
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

warnings.filterwarnings('ignore')

ARTIFACTS_DIR = os.path.join(os.path.dirname(__file__), 'artifacts')
DATA_PATH = os.path.join(os.path.dirname(__file__), 'data', 'biometric_data.csv')
os.makedirs(ARTIFACTS_DIR, exist_ok=True)

df = pd.read_csv(DATA_PATH)

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

imputer = SimpleImputer(strategy='median')
X_imputed = pd.DataFrame(imputer.fit_transform(X), columns=FEATURE_COLS)

scaler = StandardScaler()
X_scaled = pd.DataFrame(scaler.fit_transform(X_imputed), columns=FEATURE_COLS)

var_thresh = VarianceThreshold(threshold=0.01)
X_var = var_thresh.fit_transform(X_scaled)
surviving_features = [FEATURE_COLS[i] for i, keep in enumerate(var_thresh.get_support()) if keep]
print(f"[CO2] Features after VarianceThreshold: {surviving_features}")

pca = PCA(n_components=0.95, random_state=42)
X_pca = pca.fit_transform(X_var)
print(f"[CO2] PCA components retained: {pca.n_components_}")
print(f"[CO2] Explained variance ratio: {pca.explained_variance_ratio_}")
print(f"[CO2] Total explained variance: {sum(pca.explained_variance_ratio_):.4f}")

preprocessing_pipeline = Pipeline([
    ('imputer', SimpleImputer(strategy='median')),
    ('scaler', StandardScaler()),
    ('variance_threshold', VarianceThreshold(threshold=0.01)),
    ('pca', PCA(n_components=0.95, random_state=42)),
])

preprocessing_pipeline.fit(X)
X_transformed = preprocessing_pipeline.transform(X)

joblib.dump(preprocessing_pipeline, os.path.join(ARTIFACTS_DIR, 'preprocessing_pipeline.pkl'))
print("[SAVED] preprocessing_pipeline.pkl")

X_train_clf, X_test_clf, y_train_clf, y_test_clf = train_test_split(
    X_transformed, y_class, test_size=0.2, random_state=42, stratify=y_class
)

smote = SMOTE(random_state=42)
X_train_clf_resampled, y_train_clf_resampled = smote.fit_resample(X_train_clf, y_train_clf)
print(f"[CO1] Class distribution after SMOTE: {pd.Series(y_train_clf_resampled).value_counts().to_dict()}")

svm_clf = SVC(kernel='rbf', probability=True, random_state=42, class_weight='balanced')
svm_clf.fit(X_train_clf_resampled, y_train_clf_resampled)

lr_clf = LogisticRegression(solver='lbfgs', max_iter=1000, random_state=42, class_weight='balanced')
lr_clf.fit(X_train_clf_resampled, y_train_clf_resampled)

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

X_train_reg, X_test_reg, y_train_reg, y_test_reg = train_test_split(
    X_transformed, y_reg, test_size=0.2, random_state=42
)

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

inertias = []
sil_scores = []
K_RANGE = range(2, 11)

print("\n[CO6] Running elbow + silhouette analysis...")
for k in K_RANGE:
    km = KMeans(n_clusters=k, random_state=42, n_init=10)
    labels = km.fit_predict(X_transformed)
    inertias.append(km.inertia_)
    sil_scores.append(silhouette_score(X_transformed, labels))
    print(f"  k={k}: inertia={km.inertia_:.2f}, silhouette={sil_scores[-1]:.4f}")

best_k = list(K_RANGE)[np.argmax(sil_scores)]
print(f"\n[CO6] Optimal k: {best_k} (Silhouette: {max(sil_scores):.4f})")

kmeans_final = KMeans(n_clusters=best_k, random_state=42, n_init=10)
cluster_labels = kmeans_final.fit_predict(X_transformed)

final_silhouette = silhouette_score(X_transformed, cluster_labels)
final_db_index = davies_bouldin_score(X_transformed, cluster_labels)

print(f"[CO6] Final Silhouette Score: {final_silhouette:.4f}")
print(f"[CO6] Final Davies-Bouldin Index: {final_db_index:.4f}")

joblib.dump(kmeans_final, os.path.join(ARTIFACTS_DIR, 'clusterer_model.pkl'))
print("[SAVED] clusterer_model.pkl")

cluster_label_map = {}
for i in range(best_k):
    cluster_mask = cluster_labels == i
    cluster_data = X_imputed[cluster_mask]
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

pipeline_pca = preprocessing_pipeline.named_steps['pca']

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
        "cluster_label_map": {str(k): v for k, v in cluster_label_map.items()},
        "elbow_data": {
            "k_values": list(K_RANGE),
            "inertias": [round(x, 2) for x in inertias],
            "silhouette_scores": [round(x, 4) for x in sil_scores],
        },
    },
    "feature_columns": FEATURE_COLS,
    "pca_components_retained": int(pipeline_pca.n_components_),
    "pca_explained_variance": round(float(sum(pipeline_pca.explained_variance_ratio_)), 4),
}

with open(os.path.join(ARTIFACTS_DIR, 'training_metrics.json'), 'w') as f:
    json.dump(metrics, f, indent=2)
print("[SAVED] training_metrics.json")

print("\n✅ Training pipeline complete. All artifacts saved to:", ARTIFACTS_DIR)
