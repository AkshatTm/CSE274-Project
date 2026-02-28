'use client';

import BentoCard from './BentoCard';
import AnimatedNumber from './AnimatedNumber';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { PredictionResponse } from '@/lib/api';

interface EnergyForecastProps { data: PredictionResponse | null; }

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '0.75rem',
          padding: '8px 14px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          fontSize: 13,
          fontFamily: 'var(--font-sans)',
        }}
      >
        <span style={{ color: '#9ca3af', marginRight: 6, fontWeight: 500 }}>{label}</span>
        <strong style={{ color: '#8cc63f', fontFamily: 'var(--font-heading)' }}>{payload[0].value} kcal</strong>
      </div>
    );
  }
  return null;
};

export default function EnergyForecast({ data }: EnergyForecastProps) {
  const chartData = data
    ? [
      { day: 'Mon', calories: Math.round(data.predicted_expenditure_value * 0.85) },
      { day: 'Tue', calories: Math.round(data.predicted_expenditure_value * 0.92) },
      { day: 'Wed', calories: Math.round(data.predicted_expenditure_value * 1.05) },
      { day: 'Thu', calories: Math.round(data.predicted_expenditure_value * 0.78) },
      { day: 'Fri', calories: Math.round(data.predicted_expenditure_value * 0.95) },
      { day: 'Sat', calories: Math.round(data.predicted_expenditure_value * 1.10) },
      { day: 'Today', calories: Math.round(data.predicted_expenditure_value) },
    ]
    : [];

  return (
    <BentoCard className="flex flex-col" style={{ minHeight: 280, flex: 1 }} index={2}>
      <div className="flex items-start justify-between mb-5">
        <div>
          <span className="label-xs block mb-2">Energy Forecast</span>
          {data ? (
            <AnimatedNumber
              value={data.predicted_expenditure_value}
              decimals={0}
              suffix=" kcal"
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '2.6rem',
                fontWeight: 800,
                color: '#1a202c',
                letterSpacing: '-0.03em',
                lineHeight: 1,
              }}
            />
          ) : (
            <span
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '2.6rem',
                fontWeight: 800,
                color: '#e2e8f0',
                letterSpacing: '-0.03em',
              }}
            >
              — kcal
            </span>
          )}
        </div>
        {data && <span className="metric-badge mt-1">RMSE: {data.pipeline_validation_metrics.rmse} kcal</span>}
      </div>

      <div className="flex-1" style={{ minHeight: 170 }}>
        {data && chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={170}>
            <AreaChart data={chartData} margin={{ top: 4, right: 2, left: -28, bottom: 0 }}>
              <defs>
                <linearGradient id="calGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8cc63f" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#8cc63f" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 12, fill: '#9ca3af', fontFamily: 'var(--font-sans)', fontWeight: 500 }}
                axisLine={false} tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#9ca3af', fontFamily: 'var(--font-sans)', fontWeight: 500 }}
                axisLine={false} tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="calories"
                stroke="#8cc63f"
                strokeWidth={2.5}
                fill="url(#calGrad)"
                dot={{ r: 4, fill: '#fff', stroke: '#8cc63f', strokeWidth: 2.5 }}
                activeDot={{ r: 6, fill: '#8cc63f', stroke: '#fff', strokeWidth: 2 }}
                animationDuration={1400}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#d1d5db" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 17l6-6 4 4 8-10" />
            </svg>
            <span
              style={{ fontSize: '0.82rem', fontWeight: 500, color: '#cbd5e1', fontFamily: 'var(--font-sans)', letterSpacing: '0.01em' }}
            >
              Chart populates after synthesis
            </span>
          </div>
        )}
      </div>
    </BentoCard>
  );
}
