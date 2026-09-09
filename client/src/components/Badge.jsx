import clsx from 'clsx';

const VARIANTS = {
  neutral: 'bg-surface-soft text-text-secondary',
  primary: 'bg-primary-100 text-primary-700',
  accent: 'bg-primary-100 text-primary-700',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-danger/10 text-danger',
};

export default function Badge({ variant = 'neutral', children, className }) {
  return <span className={clsx('badge', VARIANTS[variant], className)}>{children}</span>;
}

export function roleVariant(role) {
  switch (role) {
    case 'admin':
      return 'danger';
    case 'project_manager':
      return 'primary';
    case 'analyst':
      return 'success';
    default:
      return 'neutral';
  }
}
