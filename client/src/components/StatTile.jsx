import { useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';

function useCountUp(value) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v).toLocaleString());

  useEffect(() => {
    const controls = animate(count, value, { duration: 0.7, ease: [0.22, 1, 0.36, 1] });
    return controls.stop;
  }, [value]);

  return rounded;
}

export default function StatTile({ icon: Icon, label, value, subtext }) {
  const display = useCountUp(Number(value) || 0);

  return (
    <div className="card card-hover flex items-center gap-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-text-muted">{label}</p>
        <motion.p className="font-display text-2xl font-medium text-text-primary">{display}</motion.p>
        {subtext && <p className="truncate text-xs text-text-secondary">{subtext}</p>}
      </div>
    </div>
  );
}
