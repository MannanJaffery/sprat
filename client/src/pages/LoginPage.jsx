import { useState } from 'react';
import { Navigate, useLocation, useNavigate, Link } from 'react-router-dom';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { motion } from 'framer-motion';
import {
  Mail, Lock, Eye, EyeOff, Loader2,
  Target, GitBranch, Users2, Sparkles, ChevronDown, Wand2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Logo from '../components/Logo';
import { useAuth } from '../hooks/useAuth';
import { getErrorMessage } from '../api/client';
import { fadeInUp } from '../lib/motion';

const FEATURES = [
  {
    icon: Target,
    title: 'Goal mining & classification',
    description: 'Extract privacy goals from policy text and classify them by taxonomy and subject.',
  },
  {
    icon: GitBranch,
    title: 'Scenario modeling',
    description: 'Model concrete usage scenarios and trace them back to the goals they instantiate.',
  },
  {
    icon: Users2,
    title: 'Multi-analyst reconciliation',
    description: 'Independent classifications are compared automatically once every analyst has submitted.',
  },
];

// Seeded via server/db/seedDemoUsers.js — one pre-approved account per role, so
// the app can be tried immediately without going through sign-up/approval.
const DEMO_ACCOUNTS = [
  { role: 'Admin', email: 'admin@sprat.dev', password: 'Demo@1234' },
  { role: 'Project Manager', email: 'manager@sprat.dev', password: 'Demo@1234' },
  { role: 'Analyst', email: 'analyst@sprat.dev', password: 'Demo@1234' },
  { role: 'Guest', email: 'guest@sprat.dev', password: 'Demo@1234' },
];

export default function LoginPage() {
  const { user, login, loading, resetPasswordForEmail } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resetting, setResetting] = useState(false);

  if (!loading && user) {
    const from = location.state?.from?.pathname || '/projects';
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(email, password);
      toast.success('Welcome back.');
      navigate('/projects');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error('Enter your email above first, then click "Forgot password?".');
      return;
    }
    setResetting(true);
    try {
      await resetPasswordForEmail(email);
      toast.success('Check your email for a password reset link.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      {/* Left: brand panel */}
      <div className="relative hidden overflow-hidden bg-text-primary lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="blob animate-blob -left-24 -top-24 h-96 w-96 bg-primary-500/40" />
          <div className="blob animate-blob-slow -bottom-32 -right-16 h-[28rem] w-[28rem] bg-primary-300/20" />
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                'radial-gradient(circle, #FAF7F0 1px, transparent 1px)',
              backgroundSize: '28px 28px',
            }}
          />
        </div>

        <motion.div initial="hidden" animate="show" variants={fadeInUp} className="relative z-10 flex items-center gap-2.5">
          <Logo size={40} className="drop-shadow-[0_4px_12px_rgba(154,119,32,0.4)]" />
          <span className="font-display text-xl font-semibold text-background">SPRAT</span>
        </motion.div>

        <motion.div
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.08 } } }}
          className="relative z-10 max-w-md space-y-10"
        >
          <motion.div variants={fadeInUp} className="space-y-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary-300/30 bg-primary-500/10 px-3 py-1 text-xs font-medium text-primary-200">
              <Sparkles size={12} /> Security &amp; Privacy Requirements Analysis
            </span>
            <h1 className="font-display text-4xl font-medium leading-tight text-background">
              Analyze privacy policies with confidence.
            </h1>
            <p className="text-sm leading-relaxed text-background/60">
              SPRAT helps analysts mine goals and scenarios from policy documents, reconcile
              independent classifications, and keep a full audit trail — all in one workspace.
            </p>
          </motion.div>

          <div className="space-y-5">
            {FEATURES.map((f) => (
              <motion.div key={f.title} variants={fadeInUp} className="flex gap-3.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background/10 text-primary-200">
                  <f.icon size={17} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-background">{f.title}</p>
                  <p className="text-sm text-background/55">{f.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.p initial="hidden" animate="show" variants={fadeInUp} className="relative z-10 text-xs text-background/40">
          © {new Date().getFullYear()} SPRAT.
        </motion.p>
      </div>

      {/* Right: form panel */}
      <div className="flex items-center justify-center bg-background px-6 py-12">
        <motion.div initial="hidden" animate="show" variants={fadeInUp} className="w-full max-w-sm space-y-8">
          <div className="space-y-1 lg:hidden">
            <div className="mb-4 flex items-center gap-2.5">
              <Logo size={36} />
              <span className="font-display text-lg font-semibold text-text-primary">SPRAT</span>
            </div>
          </div>

          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl font-medium text-text-primary">Welcome back</h2>
              <p className="mt-1 text-sm text-text-secondary">Sign in to continue to your workspace.</p>
            </div>

            <Menu as="div" className="relative shrink-0">
              <Menu.Button className="btn-secondary !py-1.5 text-xs">
                <Wand2 size={13} /> Quick login <ChevronDown size={13} />
              </Menu.Button>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-150"
                enterFrom="opacity-0 scale-95 -translate-y-1"
                enterTo="opacity-100 scale-100 translate-y-0"
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 z-20 mt-2 w-60 origin-top-right rounded-xl border border-border bg-surface p-1.5 shadow-soft focus:outline-none">
                  <p className="px-3 pb-1.5 pt-1 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                    Demo accounts
                  </p>
                  {DEMO_ACCOUNTS.map((acc) => (
                    <Menu.Item key={acc.email}>
                      {({ active }) => (
                        <button
                          type="button"
                          onClick={() => {
                            setEmail(acc.email);
                            setPassword(acc.password);
                          }}
                          className={`flex w-full flex-col rounded-lg px-3 py-2 text-left text-sm ${
                            active ? 'bg-primary-50' : ''
                          }`}
                        >
                          <span className="font-medium text-text-primary">{acc.role}</span>
                          <span className="text-xs text-text-secondary">{acc.email}</span>
                        </button>
                      )}
                    </Menu.Item>
                  ))}
                </Menu.Items>
              </Transition>
            </Menu>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="email"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-9"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="label">Password</label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={resetting}
                  className="mb-1.5 text-xs font-medium text-primary-600 hover:text-primary-700"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-9 pr-9"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-primary w-full" disabled={submitting}>
              {submitting && <Loader2 size={16} className="animate-spin" />}
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-sm text-text-secondary">
            New here?{' '}
            <Link to="/signup" className="font-medium text-primary-600 hover:text-primary-700">
              Create an account
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
