import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ARTIFACTS_DIR = os.path.join(BASE_DIR, 'ml', 'artifacts')
METRICS_PATH = os.path.join(ARTIFACTS_DIR, 'training_metrics.json')

PREPROCESSING_PIPELINE_PATH = os.path.join(ARTIFACTS_DIR, 'preprocessing_pipeline.pkl')
CLASSIFIER_MODEL_PATH = os.path.join(ARTIFACTS_DIR, 'classifier_model.pkl')
REGRESSOR_MODEL_PATH = os.path.join(ARTIFACTS_DIR, 'regressor_model.pkl')
CLUSTERER_MODEL_PATH = os.path.join(ARTIFACTS_DIR, 'clusterer_model.pkl')

API_V1_PREFIX = "/api/v1"
CORS_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"]
