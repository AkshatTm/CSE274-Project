import json
import joblib
import numpy as np
import pandas as pd
from app.core.config import (
    PREPROCESSING_PIPELINE_PATH,
    CLASSIFIER_MODEL_PATH,
    REGRESSOR_MODEL_PATH,
    CLUSTERER_MODEL_PATH,
    METRICS_PATH,
)

preprocessing_pipeline = None
classifier = None
regressor = None
clusterer = None
training_metrics = None

FEATURE_COLS = [
    'resting_heart_rate', 'hrv_ms', 'sleep_hours', 'deep_sleep_pct',
    'rem_sleep_pct', 'steps', 'active_minutes', 'stress_score',
    'spo2_pct', 'body_temp_deviation'
]


def load_models():
    global preprocessing_pipeline, classifier, regressor, clusterer, training_metrics

    preprocessing_pipeline = joblib.load(PREPROCESSING_PIPELINE_PATH)
    classifier = joblib.load(CLASSIFIER_MODEL_PATH)
    regressor = joblib.load(REGRESSOR_MODEL_PATH)
    clusterer = joblib.load(CLUSTERER_MODEL_PATH)

    with open(METRICS_PATH, 'r') as f:
        training_metrics = json.load(f)

    print("✅ All models and metrics loaded successfully.")


def predict(input_array: np.ndarray) -> dict:
    X_df = pd.DataFrame(input_array, columns=FEATURE_COLS)
    X_transformed = preprocessing_pipeline.transform(X_df)

    readiness_label = classifier.predict(X_transformed)[0]
    readiness_proba = classifier.predict_proba(X_transformed)[0]
    readiness_score = round(float(np.max(readiness_proba)) * 100, 1)

    predicted_calories = float(regressor.predict(X_transformed)[0])
    predicted_calories = round(max(0, predicted_calories), 1)

    cluster_id = int(clusterer.predict(X_transformed)[0])
    cluster_label_map = training_metrics['clustering']['cluster_label_map']
    cluster_label = cluster_label_map.get(str(cluster_id), f"Cluster {cluster_id}")

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
