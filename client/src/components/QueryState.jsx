import { AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { getErrorMessage } from '../api/client';
import { fadeInUp } from '../lib/motion';

// Wraps a react-query result so every screen shows consistent, observable
// loading/error/success feedback instead of ad-hoc spinners per page.
export default function QueryState({ query, children }) {
  if (query.isLoading) {
    return (
      <div className="space-y-3">
        <div className="skeleton h-24 w-full" />
        <div className="skeleton h-24 w-full" />
        <div className="skeleton h-24 w-2/3" />
      </div>
    );
  }

  if (query.isError) {
    return (
      <motion.div
        initial="hidden"
        animate="show"
        variants={fadeInUp}
        className="card flex items-center gap-3 border-danger/30 bg-danger/5 text-danger"
      >
        <AlertTriangle size={20} />
        <span className="text-sm">{getErrorMessage(query.error)}</span>
      </motion.div>
    );
  }

  return children(query.data);
}
