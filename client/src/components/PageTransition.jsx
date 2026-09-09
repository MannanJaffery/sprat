import { motion } from 'framer-motion';
import { pageTransition } from '../lib/motion';

export default function PageTransition({ children }) {
  return (
    <motion.div variants={pageTransition} initial="hidden" animate="show" exit="exit">
      {children}
    </motion.div>
  );
}
