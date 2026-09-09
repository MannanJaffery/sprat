import { motion } from 'framer-motion';
import { fadeInUp } from '../lib/motion';

export default function PageHeader({ icon: Icon, eyebrow, title, description, actions }) {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={fadeInUp}
      className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
    >
      <div className="flex items-start gap-3.5">
        {Icon && (
          <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
            <Icon size={20} />
          </div>
        )}
        <div>
          {eyebrow && (
            <p className="text-xs font-semibold uppercase tracking-wide text-primary-600">{eyebrow}</p>
          )}
          <h1 className="font-display text-2xl font-medium tracking-tight text-text-primary">{title}</h1>
          {description && <div className="mt-1 text-sm text-text-secondary">{description}</div>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </motion.div>
  );
}
