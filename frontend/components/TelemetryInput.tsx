'use client';

import { useState } from 'react';
import BentoCard from './BentoCard';
import type { BiometricInput } from '@/lib/api';
import { motion } from 'framer-motion';

interface SliderConfig {
  key: keyof BiometricInput;
  label: string;
  min: number;
  max: number;
  step: number;
  unit: string;
  defaultValue: number;
  color: string;
}

const SLIDER_CONFIG: SliderConfig[] = [
  { key: 'resting_heart_rate', label: 'Resting HR', min: 40, max: 100, step: 1, unit: 'bpm', defaultValue: 65, color: '#f87171' },
  { key: 'hrv_ms', label: 'HRV', min: 15, max: 150, step: 1, unit: 'ms', defaultValue: 50, color: '#8cc63f' },
  { key: 'sleep_hours', label: 'Sleep', min: 3, max: 12, step: 0.5, unit: 'hrs', defaultValue: 7, color: '#a78bfa' },
  { key: 'deep_sleep_pct', label: 'Deep Sleep', min: 5, max: 35, step: 1, unit: '%', defaultValue: 20, color: '#60a5fa' },
  { key: 'rem_sleep_pct', label: 'REM Sleep', min: 10, max: 35, step: 1, unit: '%', defaultValue: 22, color: '#c084fc' },
  { key: 'steps', label: 'Steps', min: 500, max: 30000, step: 100, unit: 'k', defaultValue: 8000, color: '#22d3ee' },
  { key: 'active_minutes', label: 'Active Min', min: 0, max: 180, step: 5, unit: 'min', defaultValue: 45, color: '#8cc63f' },
  { key: 'stress_score', label: 'Stress', min: 10, max: 100, step: 1, unit: '', defaultValue: 50, color: '#e8c74d' },
  { key: 'spo2_pct', label: 'SpO₂', min: 90, max: 100, step: 0.5, unit: '%', defaultValue: 97, color: '#22d3ee' },
  { key: 'body_temp_deviation', label: 'Temp Δ', min: -1.0, max: 2.0, step: 0.1, unit: '°C', defaultValue: 0, color: '#f87171' },
];

interface TelemetryInputProps {
  onSubmit: (data: BiometricInput) => void;
  isLoading: boolean;
}

function IosSlider({ slider, value, onChange }: {
  slider: SliderConfig;
  value: number;
  onChange: (v: number) => void;
}) {
  const pct = ((value - slider.min) / (slider.max - slider.min)) * 100;
  const displayVal = slider.key === 'steps' ? (value / 1000).toFixed(1) : value;

  return (
    <div className="group">
      <div className="flex justify-between items-center mb-2" style={{ letterSpacing: '0.01em' }}>
        <span
          style={{
            fontSize: '0.72rem',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#6b7280',
            fontFamily: 'var(--font-sans)',
          }}
        >
          {slider.label}
        </span>
        <motion.span
          key={String(value)}
          initial={{ opacity: 0.7, y: -3 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            fontSize: '0.82rem',
            fontWeight: 700,
            color: slider.color,
            fontFamily: 'var(--font-heading)',
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '0.02em',
          }}
        >
          {displayVal}{slider.unit}
        </motion.span>
      </div>
      <div className="relative h-5 flex items-center">
        <div className="absolute inset-x-0 h-[4px] rounded-full bg-slate-200" />
        <div
          className="absolute left-0 h-[4px] rounded-full transition-all duration-75"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${slider.color}88, ${slider.color})`,
          }}
        />
        <input
          type="range"
          min={slider.min}
          max={slider.max}
          step={slider.step}
          value={value}
          aria-label={slider.label}
          aria-valuenow={value}
          aria-valuemin={slider.min}
          aria-valuemax={slider.max}
          aria-valuetext={`${displayVal}${slider.unit}`}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="ios-slider absolute inset-x-0"
        />
      </div>
    </div>
  );
}

export default function TelemetryInput({ onSubmit, isLoading }: TelemetryInputProps) {
  const [values, setValues] = useState<BiometricInput>(
    Object.fromEntries(SLIDER_CONFIG.map((s) => [s.key, s.defaultValue])) as unknown as BiometricInput
  );

  const handleChange = (key: keyof BiometricInput, val: number) =>
    setValues((prev) => ({ ...prev, [key]: val }));

  return (
    <BentoCard className="flex flex-col h-full" index={0}>
      <div className="flex items-center gap-2.5 mb-2">
        <span
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ background: '#8cc63f', animation: 'pulse-glow 2s infinite' }}
        />
        <span
          style={{
            fontSize: '0.68rem',
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: '#9ca3af',
            fontFamily: 'var(--font-sans)',
          }}
        >
          Biometric Telemetry
        </span>
      </div>

      <h2
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '1.75rem',
          fontWeight: 800,
          color: '#1a202c',
          lineHeight: 1.2,
          letterSpacing: '-0.02em',
          marginBottom: '1.25rem',
        }}
      >
        Input Vitals
      </h2>

      <div className="space-y-4 flex-1 overflow-y-auto pr-1" style={{ maxHeight: 440 }}>
        {SLIDER_CONFIG.map((slider) => (
          <IosSlider
            key={slider.key}
            slider={slider}
            value={values[slider.key] as number}
            onChange={(v) => handleChange(slider.key, v)}
          />
        ))}
      </div>

      <motion.button
        onClick={() => onSubmit(values)}
        disabled={isLoading}
        className="mt-6 w-full py-3.5 rounded-xl font-bold uppercase tracking-widest
                   disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          background: isLoading
            ? '#e2e8f0'
            : 'linear-gradient(135deg, #8cc63f 0%, #e8c74d 100%)',
          color: isLoading ? '#9ca3af' : '#1a202c',
          fontFamily: 'var(--font-heading)',
          fontSize: '0.78rem',
          letterSpacing: '0.12em',
          fontWeight: 700,
          boxShadow: isLoading ? 'none' : '0 4px 14px rgba(140,198,63,0.35)',
          border: 'none',
        }}
        whileHover={{ scale: 1.02, boxShadow: '0 6px 20px rgba(140,198,63,0.45)' }}
        whileTap={{ scale: 0.98 }}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Synthesizing…
          </span>
        ) : 'Synthesize Vitals'}
      </motion.button>
    </BentoCard>
  );
}
