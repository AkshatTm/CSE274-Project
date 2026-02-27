import os
import numpy as np
import pandas as pd

np.random.seed(42)
n_per_archetype = 500

def make_archetype(n, rhr_mu, hrv_mu, sleep_mu, deep_mu, rem_mu,
                   steps_mu, active_mu, stress_mu, spo2_mu, temp_mu,
                   rhr_sd=5, hrv_sd=10, sleep_sd=0.6, deep_sd=3,
                   rem_sd=2, steps_sd=2000, active_sd=15, stress_sd=8,
                   spo2_sd=0.8, temp_sd=0.2):
    return {
        'resting_heart_rate': np.random.normal(rhr_mu,    rhr_sd,    n).clip(40, 100),
        'hrv_ms':             np.random.normal(hrv_mu,    hrv_sd,    n).clip(15, 150),
        'sleep_hours':        np.random.normal(sleep_mu,  sleep_sd,  n).clip(3, 12),
        'deep_sleep_pct':     np.random.normal(deep_mu,   deep_sd,   n).clip(5, 35),
        'rem_sleep_pct':      np.random.normal(rem_mu,    rem_sd,    n).clip(10, 35),
        'steps':              np.random.normal(steps_mu,  steps_sd,  n).clip(500, 30000).astype(int),
        'active_minutes':     np.random.normal(active_mu, active_sd, n).clip(0, 180).astype(int),
        'stress_score':       np.random.normal(stress_mu, stress_sd, n).clip(10, 100),
        'spo2_pct':           np.random.normal(spo2_mu,   spo2_sd,   n).clip(90, 100),
        'body_temp_deviation':np.random.normal(temp_mu,   temp_sd,   n).clip(-1.0, 2.0),
    }

well_recovered = make_archetype(
    n_per_archetype,
    rhr_mu=52,  hrv_mu=95,  sleep_mu=8.5, deep_mu=28, rem_mu=27,
    steps_mu=9000, active_mu=55, stress_mu=22, spo2_mu=98.5, temp_mu=0.0,
    rhr_sd=5, hrv_sd=12, sleep_sd=0.7, deep_sd=3, rem_sd=2,
    steps_sd=1500, active_sd=12, stress_sd=6, spo2_sd=0.6, temp_sd=0.15,
)

active_performer = make_archetype(
    n_per_archetype,
    rhr_mu=62,  hrv_mu=58,  sleep_mu=6.8, deep_mu=19, rem_mu=21,
    steps_mu=18000, active_mu=115, stress_mu=42, spo2_mu=97.5, temp_mu=0.3,
    rhr_sd=5, hrv_sd=8, sleep_sd=0.6, deep_sd=3, rem_sd=2,
    steps_sd=2500, active_sd=18, stress_sd=8, spo2_sd=0.7, temp_sd=0.2,
)

high_strain = make_archetype(
    n_per_archetype,
    rhr_mu=82,  hrv_mu=24,  sleep_mu=4.5, deep_mu=9,  rem_mu=13,
    steps_mu=3500, active_mu=18, stress_mu=78, spo2_mu=93.5, temp_mu=1.1,
    rhr_sd=6, hrv_sd=5, sleep_sd=0.7, deep_sd=2, rem_sd=1.5,
    steps_sd=1200, active_sd=10, stress_sd=9, spo2_sd=0.9, temp_sd=0.3,
)

frames = []
for arch_data in [well_recovered, active_performer, high_strain]:
    frames.append(pd.DataFrame(arch_data))

df = pd.concat(frames, ignore_index=True)

df['active_calories'] = (
    df['steps'] * 0.04
    + df['active_minutes'] * 8
    + np.random.normal(0, 40, len(df))
).clip(100, 4000)

for col in ['hrv_ms', 'deep_sleep_pct', 'stress_score', 'spo2_pct']:
    mask = np.random.random(len(df)) < 0.05
    df.loc[mask, col] = np.nan


def compute_readiness_score(row):
    score = (
        (row['hrv_ms'] / 150) * 25
        + (row['sleep_hours'] / 12) * 25
        + (row['deep_sleep_pct'] / 35) * 10
        + (row['rem_sleep_pct'] / 35) * 5
        + (1 - row['stress_score'] / 100) * 15
        + (1 - (row['resting_heart_rate'] - 40) / 60) * 10
        + (row['spo2_pct'] - 90) / 10 * 5
        + (1 - abs(row['body_temp_deviation'])) * 5
    )
    return np.clip(score, 0, 100)


def label_readiness(score):
    if score >= 65:
        return 'Optimal Readiness'
    elif score >= 40:
        return 'Moderate Strain'
    else:
        return 'High Risk of Burnout'


df_scored = df.copy()
for col in ['hrv_ms', 'deep_sleep_pct', 'stress_score', 'spo2_pct']:
    df_scored[col] = df_scored[col].fillna(df_scored[col].median())

df['readiness_score'] = df_scored.apply(compute_readiness_score, axis=1)
df['readiness_label'] = df['readiness_score'].apply(label_readiness)

df = df.sample(frac=1, random_state=42).reset_index(drop=True)

OUTPUT_PATH = os.path.join(os.path.dirname(__file__), 'data', 'biometric_data.csv')
os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
df.to_csv(OUTPUT_PATH, index=False)

print(f"Dataset saved to: {OUTPUT_PATH}")
print(f"Shape: {df.shape}")
print(f"\nClass distribution:")
print(df['readiness_label'].value_counts())
print(f"\nMissing values per column:")
print(df.isnull().sum())
print(f"\nArchetype feature means (approx):")
print(df[['resting_heart_rate','hrv_ms','sleep_hours','stress_score','steps']].describe().loc[['mean','std']].round(1))

