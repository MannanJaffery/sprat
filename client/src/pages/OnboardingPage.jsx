import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Clock, LogOut } from 'lucide-react';
import Logo from '../components/Logo';
import { useAuth } from '../hooks/useAuth';
import { getErrorMessage } from '../api/client';
import { fadeInUp } from '../lib/motion';

const ROLE_OPTIONS = [
  { value: 'project_manager', label: 'Project Manager', description: 'Manage projects, policies, and team access.' },
  { value: 'analyst', label: 'Analyst', description: 'Mine goals and scenarios, classify, and reconcile findings.' },
  { value: 'guest', label: 'Guest', description: 'Read-only access to the projects you are added to.' },
];

export default function OnboardingPage() {
  const { user, loading, submitOnboarding, logout } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name || '');
  const [role, setRole] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.status !== 'pending') return <Navigate to="/" replace />;

  const alreadySubmitted = Boolean(user?.requested_role);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await submitOnboarding(name, role);
      toast.success('Thanks! Your request has been sent to an administrator.');
      navigate('/');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <motion.div initial="hidden" animate="show" variants={fadeInUp} className="w-full max-w-md space-y-6">
        <div className="flex items-center gap-2.5">
          <Logo size={40} />
          <span className="font-display text-lg font-semibold text-text-primary">SPRAT</span>
        </div>

        {alreadySubmitted ? (
          <div className="card flex flex-col items-center gap-3 py-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-50 text-primary-600">
              <Clock size={26} />
            </div>
            <h1 className="font-display text-xl font-medium text-text-primary">Awaiting approval</h1>
            <p className="max-w-xs text-sm text-text-secondary">
              Thanks, {user?.name || 'there'}. Your request to join as{' '}
              <strong className="text-text-primary">{ROLE_OPTIONS.find((r) => r.value === user.requested_role)?.label}</strong>{' '}
              is waiting for an administrator to approve it. You&apos;ll be able to sign in normally
              once that happens.
            </p>
            <button onClick={handleSignOut} className="btn-secondary mt-2">
              <LogOut size={15} /> Sign out
            </button>
          </div>
        ) : (
          <div className="card space-y-5">
            <div>
              <h1 className="font-display text-xl font-medium text-text-primary">Welcome to SPRAT</h1>
              <p className="mt-1 text-sm text-text-secondary">
                Tell us a bit about yourself. An administrator will review your request and grant
                access.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="label">Full name</label>
                <input
                  className="input"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jordan Rivera"
                />
              </div>

              <div>
                <label className="label">I am joining as a…</label>
                <div className="space-y-2">
                  {ROLE_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                        role === opt.value ? 'border-primary-400 bg-primary-50' : 'border-border hover:border-primary-200'
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={opt.value}
                        checked={role === opt.value}
                        onChange={(e) => setRole(e.target.value)}
                        className="mt-1 h-4 w-4 text-primary-600"
                        required
                      />
                      <span>
                        <span className="block text-sm font-medium text-text-primary">{opt.label}</span>
                        <span className="block text-xs text-text-secondary">{opt.description}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <button type="submit" className="btn-primary w-full" disabled={submitting}>
                {submitting ? 'Submitting…' : 'Submit for approval'}
              </button>
            </form>

            <button onClick={handleSignOut} className="mx-auto flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary">
              <LogOut size={13} /> Sign out
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
