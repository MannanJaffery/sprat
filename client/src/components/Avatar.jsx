import clsx from 'clsx';

// Deterministic gold-gradient avatar so the same person always gets the same look.
const GRADIENTS = [
  'from-primary-400 to-primary-600',
  'from-amber-400 to-primary-600',
  'from-primary-300 to-primary-700',
  'from-yellow-500 to-primary-700',
];

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function initialsOf(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const SIZES = {
  sm: 'h-7 w-7 text-xs',
  md: 'h-9 w-9 text-sm',
  lg: 'h-12 w-12 text-base',
};

export default function Avatar({ name, size = 'md', className }) {
  const gradient = GRADIENTS[hashString(name || '?') % GRADIENTS.length];
  return (
    <div
      className={clsx(
        'flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-semibold text-white shadow-sm',
        gradient,
        SIZES[size],
        className
      )}
      title={name}
    >
      {initialsOf(name)}
    </div>
  );
}
