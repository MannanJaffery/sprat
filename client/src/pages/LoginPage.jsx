import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Disclosure, Transition } from '@headlessui/react';
import { motion } from 'framer-motion';
import {
  ShieldCheck, Mail, Lock, Eye, EyeOff, Loader2, ChevronDown,
  Target, GitBranch, Users2, Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
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

const DEMO_ACCOUNTS = [
  { role: 'Administrator', email: 'admin@sprat.local', password: 'ChangeMe123!' },
  { role: 'Project Manager', email: 'pm@sprat.local', password: 'Password123!' },
  { role: 'Analyst', email: 'analyst1@sprat.local', password: 'Password123!' },
  { role: 'Analyst', email: 'analyst2@sprat.local', password: 'Password123!' },
  { role: 'Guest', email: 'guest@sprat.local', password: 'Password123!' },
];

export default function LoginPage() {
  const { user, login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) {
    const from = location.state?.from?.pathname || '/';
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(email, password);
      toast.success('Welcome back.');
      navigate('/');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
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
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-300 to-primary-500 shadow-glow">
            <ShieldCheck size={20} className="text-white" />
          </div>
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
          © {new Date().getFullYear()} SPRAT — built for scoped, evidence-based quality evaluation.
        </motion.p>
      </div>

      {/* Right: form panel */}
      <div className="flex items-center justify-center bg-background px-6 py-12">
        <motion.div initial="hidden" animate="show" variants={fadeInUp} className="w-full max-w-sm space-y-8">
          <div className="space-y-1 lg:hidden">
            <div className="mb-4 flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-400 to-primary-700 shadow-glow">
                <ShieldCheck size={18} className="text-white" />
              </div>
              <span className="font-display text-lg font-semibold text-text-primary">SPRAT</span>
            </div>
          </div>

          <div>
            <h2 className="font-display text-2xl font-medium text-text-primary">Welcome back</h2>
            <p className="mt-1 text-sm text-text-secondary">Sign in to continue to your workspace.</p>
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
                  placeholder="you@sprat.local"
                />
              </div>
            </div>

            <div>
              <label className="label">Password</label>
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

          <Disclosure>
            {({ open }) => (
              <div className="rounded-lg border border-border bg-surface-soft">
                <Disclosure.Button className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-text-primary">
                  Demo accounts for grading/testing
                  <ChevronDown size={16} className={`text-text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
                </Disclosure.Button>
                <Transition
                  enter="transition ease-out duration-150"
                  enterFrom="opacity-0 -translate-y-1"
                  enterTo="opacity-100 translate-y-0"
                >
                  <Disclosure.Panel className="space-y-1.5 px-4 pb-4">
                    {DEMO_ACCOUNTS.map((acc) => (
                      <button
                        key={acc.email}
                        type="button"
                        onClick={() => {
                          setEmail(acc.email);
                          setPassword(acc.password);
                        }}
                        className="flex w-full items-center justify-between rounded-md border border-border bg-surface px-3 py-2 text-left text-xs transition-colors hover:border-primary-300"
                      >
                        <span>
                          <span className="font-medium text-text-primary">{acc.role}</span>
                          <span className="ml-2 text-text-secondary">{acc.email}</span>
                        </span>
                        <span className="text-primary-600">Use</span>
                      </button>
                    ))}
                  </Disclosure.Panel>
                </Transition>
              </div>
            )}
          </Disclosure>
        </motion.div>
      </div>
    </div>
  );
}
