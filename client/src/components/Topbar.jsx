import { LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import Badge, { roleVariant } from './Badge';
import { useAuth } from '../hooks/useAuth';

const ROLE_LABELS = {
  admin: 'Administrator',
  project_manager: 'Project Manager',
  analyst: 'Analyst',
  guest: 'Guest',
};

export default function Topbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Signed out.');
      navigate('/login');
    } catch {
      toast.error('Could not sign out. Please try again.');
    }
  };

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-surface px-6">
      <div />
      <div className="flex items-center gap-4">
        {user && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-text-primary">{user.name}</span>
            <Badge variant={roleVariant(user.role)}>{ROLE_LABELS[user.role] || user.role}</Badge>
          </div>
        )}
        <button type="button" onClick={handleLogout} className="btn-secondary">
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </header>
  );
}
