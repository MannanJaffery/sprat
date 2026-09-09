import { X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { modalBackdrop, modalPanel } from '../lib/motion';

export default function Modal({ open, onClose, title, children, size = 'md' }) {
  const widths = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl' };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="backdrop"
          variants={modalBackdrop}
          initial="hidden"
          animate="show"
          exit="exit"
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-text-primary/40 p-4 pt-16 backdrop-blur-sm"
        >
          <motion.div
            key="panel"
            variants={modalPanel}
            initial="hidden"
            animate="show"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            className={`card w-full ${widths[size]}`}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-medium text-text-primary">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                className="rounded-md p-1 text-text-secondary hover:bg-background hover:text-text-primary"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
