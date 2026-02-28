'use client';

import BentoCard from './BentoCard';
import { useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { PredictionResponse } from '@/lib/api';

interface ClusterArchetypeProps { data: PredictionResponse | null; }

const CLUSTER_COLORS = ['#8cc63f', '#e8c74d', '#f87171', '#60a5fa', '#a78bfa'];
const CLUSTER_NAMES = ['Elite Athlete', 'Active Optimizer', 'Recovery Zone', 'Baseline', 'Adaptive'];

const generateClusterData = (data: PredictionResponse | null) => {
  if (!data) return [];
  const points: { x: number; y: number; cluster: number }[] = [];
  for (let c = 0; c < 3; c++) {
    const cx = 30 + c * 30;
    const cy = 40 + (c % 2) * 25;
    for (let i = 0; i < 14; i++) {
      points.push({ x: cx + (Math.random() - 0.5) * 18, y: cy + (Math.random() - 0.5) * 18, cluster: c });
    }
  }
  points.push({
    x: 30 + data.assigned_biometric_cluster * 30 + (Math.random() - 0.5) * 4,
    y: 40 + (data.assigned_biometric_cluster % 2) * 25 + (Math.random() - 0.5) * 4,
    cluster: data.assigned_biometric_cluster,
  });
  return points;
};

export default function ClusterArchetype({ data }: ClusterArchetypeProps) {
  const scatterData = useMemo(() => generateClusterData(data), [data]);
  const clusterColor = data ? CLUSTER_COLORS[data.assigned_biometric_cluster % CLUSTER_COLORS.length] : '#cbd5e1';

  return (
    <BentoCard className="flex flex-col" style={{ minHeight: 280, flex: 1 }} index={3}>
      <span className="label-xs block mb-2">Biometric Archetype</span>

      {data ? (
        <>
          <p
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1.3rem',
              fontWeight: 800,
              color: clusterColor,
              letterSpacing: '-0.01em',
              marginBottom: 2,
            }}
          >
            {data.cluster_label}
          </p>
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '0.78rem',
              fontWeight: 500,
              color: '#9ca3af',
              letterSpacing: '0.02em',
              marginBottom: '0.75rem',
            }}
          >
            {CLUSTER_NAMES[data.assigned_biometric_cluster % CLUSTER_NAMES.length]}
          </p>

          <div className="flex-1" style={{ minHeight: 155 }}>
            <ResponsiveContainer width="100%" height={155}>
              <ScatterChart margin={{ top: 4, right: 2, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  type="number" dataKey="x" name="PC1"
                  tick={{ fontSize: 11, fill: '#9ca3af', fontFamily: 'var(--font-sans)', fontWeight: 500 }}
                  axisLine={false} tickLine={false}
                />
                <YAxis
                  type="number" dataKey="y" name="PC2"
                  tick={{ fontSize: 11, fill: '#9ca3af', fontFamily: 'var(--font-sans)', fontWeight: 500 }}
                  axisLine={false} tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '0.75rem',
                    fontSize: 12,
                    fontFamily: 'var(--font-sans)',
                    color: '#374151',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  }}
                  cursor={{ stroke: '#e2e8f0' }}
                />
                <Scatter data={scatterData} animationDuration={1400}>
                  {scatterData.map((e, i) => (
                    <Cell key={`c-${i}`} fill={CLUSTER_COLORS[e.cluster % CLUSTER_COLORS.length]} opacity={0.8} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between mt-3">
            <span className="metric-badge">Silhouette: {data.pipeline_validation_metrics.silhouette_score}</span>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '3px 10px',
                borderRadius: '99px',
                color: clusterColor,
                background: `${clusterColor}18`,
                border: `1px solid ${clusterColor}33`,
                fontFamily: 'var(--font-sans)',
                letterSpacing: '0.04em',
              }}
            >
              Cluster {data.assigned_biometric_cluster}
            </span>
          </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-2">
          <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#d1d5db" strokeWidth="1.5">
            <circle cx="9" cy="9" r="3" /><circle cx="15" cy="15" r="3" /><circle cx="16" cy="8" r="2" />
          </svg>
          <span
            style={{ fontSize: '0.82rem', fontWeight: 500, color: '#cbd5e1', fontFamily: 'var(--font-sans)', letterSpacing: '0.01em' }}
          >
            Awaiting synthesis
          </span>
        </div>
      )}
    </BentoCard>
  );
}
