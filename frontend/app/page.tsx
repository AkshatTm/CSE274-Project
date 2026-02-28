'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import TelemetryInput from '@/components/TelemetryInput';
import ReadinessOracle from '@/components/ReadinessOracle';
import EnergyForecast from '@/components/EnergyForecast';
import ClusterArchetype from '@/components/ClusterArchetype';
import BentoCard from '@/components/BentoCard';
import { fetchPrediction, type BiometricInput, type PredictionResponse } from '@/lib/api';

const PROFILE_STATS = [
  { label: 'Height', value: '182 cm' },
  { label: 'Weight', value: '78 kg' },
  { label: 'Age', value: '27 yrs' },
];

const QUICK_STATS = (p: PredictionResponse | null) => [
  { label: 'Recovery', value: p ? (p.readiness_score > 70 ? 'Ready' : 'Rest') : '—', color: '#8cc63f', icon: '✦' },
  { label: 'Cluster', value: p ? `#${p.assigned_biometric_cluster}` : '—', color: '#a78bfa', icon: '◈' },
  { label: 'Energy', value: p ? `${Math.round(p.predicted_expenditure_value)} kcal` : '—', color: '#e8c74d', icon: '⚡' },
  { label: 'Accuracy', value: p ? `${(p.pipeline_validation_metrics.roc_auc * 100).toFixed(1)}%` : '—', color: '#22d3ee', icon: '◎' },
];

export default function Dashboard() {
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: BiometricInput) => {
    setIsLoading(true);
    setError(null);
    try {
      setPrediction(await fetchPrediction(data));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch prediction');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'var(--bg-page)',
        padding: '16px',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {/* ── PROFILE HEADER ──────────────────────────────── */}
      <motion.header
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="glass-card flex items-center gap-4 mb-3"
        style={{ padding: '12px 20px' }}
      >
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <Image
            src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80"
            alt="User"
            width={42}
            height={42}
            style={{
              borderRadius: '50%',
              objectFit: 'cover',
              boxShadow: '0 0 0 2px #e2e8f0',
            }}
          />
          <span
            style={{
              position: 'absolute', bottom: -1, right: -1,
              width: 11, height: 11, borderRadius: '50%',
              background: '#8cc63f',
              border: '2px solid #fff',
            }}
          />
        </div>

        {/* Greeting */}
        <div className="flex-1 min-w-0">
          <p
            style={{
              fontSize: '0.62rem',
              fontWeight: 600,
              letterSpacing: '0.13em',
              textTransform: 'uppercase',
              color: '#9ca3af',
              fontFamily: 'var(--font-sans)',
              marginBottom: 1,
            }}
          >
            Good Morning
          </p>
          <h1
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1.15rem',
              fontWeight: 800,
              color: '#1a202c',
              letterSpacing: '-0.01em',
              lineHeight: 1.2,
            }}
          >
            User 👋
          </h1>
        </div>

        {/* Body stats */}
        <div className="hidden md:flex items-center gap-2">
          {PROFILE_STATS.map((s) => (
            <div key={s.label} className="stat-pill text-center">
              <span
                style={{
                  fontSize: '0.6rem',
                  fontWeight: 600,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: '#9ca3af',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                {s.label}
              </span>
              <span
                style={{
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  color: '#1a202c',
                  fontFamily: 'var(--font-heading)',
                  letterSpacing: '-0.01em',
                }}
              >
                {s.value}
              </span>
            </div>
          ))}
        </div>

        {/* Brand */}
        <div className="flex items-center gap-3 ml-2">
          <div className="text-right hidden lg:block">
            <p
              style={{
                fontSize: '0.6rem',
                fontWeight: 700,
                letterSpacing: '0.13em',
                textTransform: 'uppercase',
                color: '#9ca3af',
                fontFamily: 'var(--font-sans)',
              }}
            >
              BioSync
            </p>
            <p
              style={{
                fontSize: '0.68rem',
                fontWeight: 500,
                color: '#cbd5e1',
                fontFamily: 'var(--font-sans)',
              }}
            >
              Performance Engine
            </p>
          </div>
          <div
            style={{
              width: 38, height: 38, borderRadius: '0.875rem',
              background: 'linear-gradient(135deg,#8cc63f,#e8c74d)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-heading)',
              fontWeight: 900, fontSize: '1rem',
              color: '#fff',
              boxShadow: '0 4px 12px rgba(140,198,63,0.35)',
            }}
          >
            B
          </div>
        </div>
      </motion.header>

      {/* ── ERROR BANNER ───────────────────────────────── */}
      {error && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          style={{
            marginBottom: 12,
            padding: '12px 16px',
            borderRadius: '0.875rem',
            fontSize: '0.85rem',
            fontWeight: 600,
            fontFamily: 'var(--font-sans)',
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.25)',
            color: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          ⚠ {error}
        </motion.div>
      )}

      {/* ── MAIN BENTO GRID ─────────────────────────────
          Flex row: Left fixed 300px | Right is its own 2-col grid
          Cards in right grid auto-size per content — no gap
      ──────────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '300px 1fr 1fr',
          gridTemplateRows: 'auto auto auto',
          gap: 12,
          alignItems: 'stretch',
        }}
      >
        {/* A: Input Vitals — full height left column */}
        <div style={{ gridColumn: 1, gridRow: '1 / 3', display: 'flex', flexDirection: 'column' }}>
          <TelemetryInput onSubmit={handleSubmit} isLoading={isLoading} />
        </div>

        {/* B1: Readiness Oracle */}
        <div style={{ gridColumn: 2, gridRow: 1, display: 'flex', flexDirection: 'column' }}>
          <ReadinessOracle data={prediction} />
        </div>

        {/* C1: Cluster Archetype */}
        <div style={{ gridColumn: 3, gridRow: 1, display: 'flex', flexDirection: 'column' }}>
          <ClusterArchetype data={prediction} />
        </div>

        {/* B2: Energy Forecast */}
        <div style={{ gridColumn: 2, gridRow: 2, display: 'flex', flexDirection: 'column' }}>
          <EnergyForecast data={prediction} />
        </div>

        {/* C2: Activity Image */}
        <BentoCard
          noPadding
          index={4}
          style={{ gridColumn: 3, gridRow: 2, minHeight: 280, position: 'relative', overflow: 'hidden' }}
        >
          <Image
            src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80"
            alt="Daily Activity"
            fill
            style={{ position: 'absolute', inset: 0, objectFit: 'cover', filter: 'brightness(0.55) saturate(1.1)' }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,transparent 20%, rgba(0,0,0,0.72) 100%)' }} />
          <div
            style={{
              position: 'absolute', top: 14, right: 14,
              fontSize: '0.68rem', fontWeight: 600, fontFamily: 'var(--font-sans)',
              padding: '4px 10px', borderRadius: '99px',
              background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.2)',
              color: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(6px)',
              letterSpacing: '0.06em',
            }}
          >
            {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px 22px' }}>
            <p className="label-xs" style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>Recovery Protocol</p>
            <h3
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '1.5rem',
                fontWeight: 800,
                color: '#ffffff',
                letterSpacing: '-0.02em',
                marginBottom: 6,
              }}
            >
              Daily Activity
            </h3>
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '0.78rem',
                fontWeight: 400,
                color: 'rgba(255,255,255,0.65)',
                lineHeight: 1.5,
                letterSpacing: '0.01em',
              }}
            >
              Active recovery and progressive overload tailored to your biometric profile.
            </p>
          </div>
        </BentoCard>

        {/* Bottom: Quick stats spanning center + right */}
        <div
          style={{
            gridColumn: '2 / 4',
            gridRow: 3,
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 12,
          }}
        >
          {QUICK_STATS(prediction).map((stat, i) => (
            <BentoCard key={stat.label} className="flex items-center gap-3" style={{ padding: '16px 18px' }} index={5 + i}>
              <span style={{ fontSize: '1.3rem', color: stat.color, flexShrink: 0 }}>{stat.icon}</span>
              <div>
                <p
                  style={{
                    fontSize: '0.62rem',
                    fontWeight: 600,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: '#9ca3af',
                    fontFamily: 'var(--font-sans)',
                    marginBottom: 3,
                  }}
                >
                  {stat.label}
                </p>
                <p
                  style={{
                    fontSize: '1.15rem',
                    fontWeight: 800,
                    color: stat.color,
                    fontFamily: 'var(--font-heading)',
                    letterSpacing: '-0.01em',
                    lineHeight: 1,
                  }}
                >
                  {stat.value}
                </p>
              </div>
            </BentoCard>
          ))}
        </div>
      </div>

      {/* Mobile fallback */}
      <style>{`
        @media (max-width: 860px) {
          main > div:nth-child(3) {
            grid-template-columns: 1fr !important;
          }
          main > div:nth-child(3) > * {
            grid-column: 1 !important;
            grid-row: auto !important;
          }
        }
      `}</style>
    </main>
  );
}
