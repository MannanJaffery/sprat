import clsx from 'clsx';

const VARIANTS = {
  neutral: 'bg-gray-100 text-gray-700',
  primary: 'bg-primary-100 text-primary-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-red-100 text-red-700',
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
