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
