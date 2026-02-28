'use client';

import BentoCard from './BentoCard';
import AnimatedNumber from './AnimatedNumber';
import type { PredictionResponse } from '@/lib/api';
import { motion } from 'framer-motion';

interface ReadinessOracleProps {
  data: PredictionResponse | null;
}

type SemanticState = { color: string; bg: string; label: string; icon: string };

function getSemantics(state: string | undefined): SemanticState {
  switch (state) {
    case 'Optimal Readiness':
      return { color: '#8cc63f', bg: 'rgba(140,198,63,0.07)', label: 'Optimal Readiness', icon: '⚡' };
    case 'Moderate Strain':
      return { color: '#d97706', bg: 'rgba(217,119,6,0.07)', label: 'Moderate Strain', icon: '⚠' };
    case 'High Risk of Burnout':
      return { color: '#ef4444', bg: 'rgba(239,68,68,0.07)', label: 'High Risk of Burnout', icon: '🔥' };
    default:
      return { color: '#9ca3af', bg: 'transparent', label: 'Awaiting Input', icon: '◯' };
  }
}

export default function ReadinessOracle({ data }: ReadinessOracleProps) {
  const sem = getSemantics(data?.readiness_classification_state);

  return (
    <BentoCard
      className="flex flex-col items-center justify-center"
      style={{ minHeight: 240, flex: 1 }}
      index={1}
    >
      <div
        className="absolute inset-0 rounded-[1.25rem] pointer-events-none transition-all duration-700"
        style={{ background: sem.bg }}
      />

      <span className="label-xs mb-4 z-10">Readiness Oracle</span>

      <motion.div
        className="z-10 leading-none"
        animate={data ? { filter: `drop-shadow(0 0 20px ${sem.color}44)` } : { filter: 'none' }}
        transition={{ duration: 0.8 }}
      >
        {data ? (
          <AnimatedNumber
            value={data.readiness_score}
            decimals={0}
            className="leading-none"
            style={{
              color: sem.color,
              fontFamily: 'var(--font-heading)',
              fontSize: '6rem',
              fontWeight: 800,
              letterSpacing: '-0.04em',
              lineHeight: 1,
            }}
          />
        ) : (
          <span
            style={{
              color: '#e2e8f0',
              fontFamily: 'var(--font-heading)',
              fontSize: '6rem',
              fontWeight: 800,
              letterSpacing: '-0.04em',
              lineHeight: 1,
            }}
          >
            —
          </span>
        )}
      </motion.div>

      <motion.p
        key={sem.label}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4 flex items-center gap-2 z-10"
        style={{
          color: sem.color,
          fontFamily: 'var(--font-sans)',
          fontSize: '0.9rem',
          fontWeight: 600,
          letterSpacing: '0.02em',
        }}
      >
        <span>{sem.icon}</span>
        {sem.label}
      </motion.p>

      {data && (
        <span className="metric-badge mt-3 z-10">
          ROC-AUC: {data.pipeline_validation_metrics.roc_auc}
        </span>
      )}
    </BentoCard>
  );
}
