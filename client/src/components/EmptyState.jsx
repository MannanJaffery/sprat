import { motion } from 'framer-motion';
import { fadeInUp } from '../lib/motion';

export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={fadeInUp}
      className="card flex flex-col items-center justify-center gap-3 py-16 text-center"
    >
      {Icon && (
        <div className="relative mb-1 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100">
          <Icon size={26} className="text-primary-500" />
        </div>
      )}
      <p className="text-base font-semibold text-text-primary">{title}</p>
      {description && <p className="max-w-sm text-sm text-text-secondary">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </motion.div>
  );
}
