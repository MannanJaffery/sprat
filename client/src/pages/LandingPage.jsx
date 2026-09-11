import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight, ArrowUpRight, Target, GitBranch, Users2, ScanSearch,
  FileText, ListChecks, BadgeCheck, Globe2, Scale, ShieldAlert, Crown,
  ClipboardList, Search, KeyRound, History, Menu as MenuIcon, X, CheckCircle2,
  LayoutDashboard,
} from 'lucide-react';
import Logo from '../components/Logo';
import {
  DocumentMiningVisual, TaxonomyVisual, ReconciliationVisual, ScenarioGraphVisual, AuditTrailVisual,
} from '../components/FeatureVisuals';
import { useAuth } from '../hooks/useAuth';

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

function Reveal({ children, className, variants = fadeUp, ...props }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-80px' }}
      variants={variants}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

const REGULATIONS = [
  { label: 'GDPR', region: 'European Union' },
  { label: 'CCPA / CPRA', region: 'California, US' },
  { label: 'HIPAA', region: 'US healthcare' },
  { label: 'PIPEDA', region: 'Canada' },
  { label: 'LGPD', region: 'Brazil' },
  { label: 'POPIA', region: 'South Africa' },
  { label: 'PDPA', region: 'Singapore' },
  { label: 'DPDP Act', region: 'India' },
];

const MARKET_STATS = [
  {
    value: '140+',
    label: 'countries now enforce a data protection or privacy law',
    note: 'up from a handful two decades ago — coverage keeps expanding almost every year.',
  },
  {
    value: '$4.9M',
    label: 'average global cost of a data breach',
    note: 'incident response, regulatory penalties, and lost business compound quickly once policy gaps surface.',
  },
  {
    value: '€1,000s',
    label: 'per day in exposure for unreconciled privacy commitments',
    note: 'regulators increasingly expect documented traceability from stated policy to implementation.',
  },
];

const FEATURES = [
  {
    icon: ScanSearch,
    tag: '01',
    title: 'Mine goals straight out of policy text',
    body:
      'Feed in a privacy policy or terms document and extract the concrete privacy and security goals buried inside it — not just keywords, but the obligations a policy actually makes.',
    Visual: DocumentMiningVisual,
  },
  {
    icon: ListChecks,
    tag: '02',
    title: 'Classify with a taxonomy that adapts to you',
    body:
      'Start from a sensible default classification scheme, then extend it with custom types and keyword definitions specific to your domain — healthcare, finance, or anything else.',
    Visual: TaxonomyVisual,
  },
  {
    icon: Users2,
    tag: '03',
    title: 'Reconcile independent analysts automatically',
    body:
      'Assign the same document to more than one analyst. The moment every classification is in, SPRAT compares them and surfaces disagreement instead of quietly picking a winner.',
    Visual: ReconciliationVisual,
  },
  {
    icon: GitBranch,
    tag: '04',
    title: 'Trace goals to real usage scenarios',
    body:
      'Model the concrete scenarios a system runs through and link every one back to the goals it fulfills — so a stated commitment is never disconnected from how it plays out.',
    Visual: ScenarioGraphVisual,
  },
  {
    icon: History,
    tag: '05',
    title: 'Keep an audit trail that cannot be quietly edited',
    body:
      'Every classification, scenario change, and access event is written to an append-only log — the record you show a regulator or an auditor is the record that actually happened.',
    Visual: AuditTrailVisual,
  },
];

const ROLES = [
  {
    icon: Crown,
    role: 'Admin',
    body: 'Full oversight across every project and group — approves signups, resolves access, never hits a locked door.',
  },
  {
    icon: ClipboardList,
    role: 'Project Manager',
    body: 'Owns projects end to end — documents, domains, team membership, and the join requests that come in.',
  },
  {
    icon: Target,
    role: 'Analyst',
    body: 'Does the actual goal mining, classification, and scenario work this tool exists for.',
  },
  {
    icon: Search,
    role: 'Guest',
    body: 'Scoped, read-only visibility into exactly the domains a project chooses to share.',
  },
];

function NavBar() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const isActiveUser = user?.status === 'active';

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-2.5">
          <Logo size={32} />
          <span className="font-display text-lg font-semibold text-text-primary">SPRAT</span>
        </div>

        <nav className="hidden items-center gap-8 md:flex">
          <a href="#product" className="text-sm text-text-secondary transition-colors hover:text-text-primary">Product</a>
          <a href="#market" className="text-sm text-text-secondary transition-colors hover:text-text-primary">Why it matters</a>
          <a href="#roles" className="text-sm text-text-secondary transition-colors hover:text-text-primary">Roles</a>
          {isActiveUser ? (
            <Link to="/projects" className="btn-secondary !py-1.5 text-sm">
              <LayoutDashboard size={15} /> Dashboard
            </Link>
          ) : (
            <Link to="/login" className="text-sm font-medium text-text-primary transition-colors hover:text-primary-600">
              Sign in
            </Link>
          )}
        </nav>

        <button className="md:hidden" onClick={() => setOpen((v) => !v)} aria-label="Toggle menu">
          {open ? <X size={20} /> : <MenuIcon size={20} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-background px-6 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            <a href="#product" onClick={() => setOpen(false)} className="text-sm text-text-secondary">Product</a>
            <a href="#market" onClick={() => setOpen(false)} className="text-sm text-text-secondary">Why it matters</a>
            <a href="#roles" onClick={() => setOpen(false)} className="text-sm text-text-secondary">Roles</a>
            {isActiveUser ? (
              <Link to="/projects" onClick={() => setOpen(false)} className="flex items-center gap-1.5 text-sm font-medium text-text-primary">
                <LayoutDashboard size={15} /> Dashboard
              </Link>
            ) : (
              <Link to="/login" onClick={() => setOpen(false)} className="text-sm font-medium text-text-primary">Sign in</Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="blob animate-blob -left-32 -top-32 h-[28rem] w-[28rem] bg-primary-300/30" />
        <div className="blob animate-blob-slow -right-24 top-24 h-96 w-96 bg-primary-500/15" />
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: 'radial-gradient(circle, #1F1D18 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 gap-16 px-6 pb-28 pt-20 lg:grid-cols-[1.15fr,0.85fr] lg:items-center lg:pt-28">
        <motion.div initial="hidden" animate="show" variants={stagger}>
          <motion.span
            variants={fadeUp}
            className="inline-flex items-center gap-1.5 rounded-full border border-primary-300/40 bg-primary-500/10 px-3 py-1 text-xs font-medium text-primary-700"
          >
            <BadgeCheck size={12} /> Security &amp; Privacy Requirements Analysis
          </motion.span>

          <motion.h1
            variants={fadeUp}
            className="mt-6 font-display text-5xl font-medium leading-[1.08] tracking-tight text-text-primary sm:text-6xl lg:text-[3.4rem] xl:text-6xl"
          >
            Turn privacy policies into <em className="font-medium italic text-primary-600">provable</em> commitments.
          </motion.h1>

          <motion.p variants={fadeUp} className="mt-6 max-w-xl text-lg leading-relaxed text-text-secondary">
            SPRAT mines security and privacy goals out of policy documents, classifies them against a
            taxonomy your team controls, reconciles what independent analysts find, and keeps an
            audit trail that never quietly changes underneath you.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link to="/signup" className="btn-primary px-6 py-3 text-base">
              Start your workspace <ArrowRight size={18} />
            </Link>
            <p className="text-sm text-text-muted">
              Free to sign up · access is approved by your team's admin
            </p>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94, rotate: -1 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-br from-primary-200/50 to-primary-400/20 blur-2xl" />
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-soft">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2 text-xs font-medium text-text-muted">
                <FileText size={13} /> data-retention-policy.pdf
              </div>
              <span className="badge bg-success/10 text-success">Reconciled</span>
            </div>
            <div className="mt-4 space-y-3">
              {[
                { g: 'Retain payment data no longer than necessary', c: 'Data Minimization', pct: 100 },
                { g: 'Notify users within 72 hours of a breach', c: 'Breach Notification', pct: 100 },
                { g: 'Allow users to export their personal data', c: 'User Rights', pct: 66 },
              ].map((row) => (
                <div key={row.g} className="rounded-lg border border-border/70 bg-background/60 p-3">
                  <p className="text-sm font-medium text-text-primary">{row.g}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="badge bg-primary-100 text-primary-700">{row.c}</span>
                    <span className="flex items-center gap-1 text-xs text-text-muted">
                      <CheckCircle2 size={12} className={row.pct === 100 ? 'text-success' : 'text-warning'} />
                      {row.pct}% analyst agreement
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function RegulationMarquee() {
  const doubled = [...REGULATIONS, ...REGULATIONS];
  return (
    <div className="border-y border-border bg-surface-soft py-5">
      <div className="mb-3 text-center text-xs font-medium uppercase tracking-widest text-text-muted">
        Built for a world of overlapping regulation
      </div>
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-surface-soft to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-surface-soft to-transparent" />
        <motion.div
          className="flex w-max gap-10"
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
        >
          {doubled.map((r, i) => (
            <div key={`${r.label}-${i}`} className="flex shrink-0 items-center gap-2.5 whitespace-nowrap">
              <Scale size={15} className="text-primary-500" />
              <span className="text-sm font-semibold text-text-primary">{r.label}</span>
              <span className="text-xs text-text-muted">{r.region}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

function MarketSection() {
  return (
    <section id="market" className="mx-auto max-w-7xl px-6 py-28">
      <Reveal className="max-w-2xl">
        <span className="text-xs font-semibold uppercase tracking-widest text-primary-600">Why it matters</span>
        <h2 className="mt-3 font-display text-4xl font-medium leading-tight text-text-primary">
          Privacy regulation isn't slowing down —{' '}
          <em className="italic text-primary-600">and neither is scrutiny</em> of whether policies match reality.
        </h2>
        <p className="mt-5 text-text-secondary">
          Every new jurisdiction adds its own obligations on top of the ones you already carry. The
          gap regulators, auditors, and users increasingly ask about isn't whether you wrote a
          policy — it's whether you can show the goals inside it are actually implemented.
        </p>
      </Reveal>

      <div className="mt-16 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-3">
        {MARKET_STATS.map((s, i) => (
          <Reveal
            key={s.label}
            variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.08 } } }}
            className="bg-background p-8"
          >
            <p className="font-display text-5xl font-medium text-primary-600">{s.value}</p>
            <p className="mt-3 text-sm font-semibold text-text-primary">{s.label}</p>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">{s.note}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function FeatureRow({ feature, index }) {
  const reversed = index % 2 === 1;
  const Visual = feature.Visual;
  return (
    <Reveal className="grid grid-cols-1 items-center gap-10 py-14 lg:grid-cols-2 lg:gap-20">
      <div className={reversed ? 'lg:order-2' : ''}>
        <div className="flex items-center gap-3">
          <span className="font-display text-6xl font-light text-primary-200">{feature.tag}</span>
          <feature.icon size={20} className="text-primary-400" strokeWidth={1.6} />
        </div>
        <h3 className="mt-2 font-display text-3xl font-medium leading-snug text-text-primary">
          {feature.title}
        </h3>
        <p className="mt-4 max-w-lg text-text-secondary">{feature.body}</p>
      </div>

      <div className={reversed ? 'lg:order-1' : ''}>
        <div className="relative">
          <div className="absolute -inset-3 -z-10 rounded-[1.75rem] bg-gradient-to-br from-primary-100/60 to-transparent" />
          <Visual />
        </div>
      </div>
    </Reveal>
  );
}

function ProductSection() {
  return (
    <section id="product" className="mx-auto max-w-7xl px-6 py-8">
      <Reveal className="max-w-2xl">
        <span className="text-xs font-semibold uppercase tracking-widest text-primary-600">Product</span>
        <h2 className="mt-3 font-display text-4xl font-medium leading-tight text-text-primary">
          One workspace, from raw policy text to a defensible answer.
        </h2>
      </Reveal>

      <div className="mt-4 divide-y divide-border">
        {FEATURES.map((f, i) => (
          <FeatureRow key={f.title} feature={f} index={i} />
        ))}
      </div>
    </section>
  );
}

function RolesSection() {
  return (
    <section id="roles" className="bg-text-primary py-28">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal className="max-w-2xl">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary-300">Access, scoped correctly</span>
          <h2 className="mt-3 font-display text-4xl font-medium leading-tight text-background">
            Built for every role on a privacy team.
          </h2>
          <p className="mt-4 text-background/60">
            Sign-ups are reviewed, not automatic — every account starts pending until an admin
            confirms the role it's requesting.
          </p>
        </Reveal>

        <Reveal variants={stagger} className="mt-14 grid grid-cols-1 gap-px overflow-hidden rounded-2xl bg-background/10 sm:grid-cols-2 lg:grid-cols-4">
          {ROLES.map((r) => (
            <motion.div key={r.role} variants={fadeUp} className="bg-text-primary p-7">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background/10 text-primary-300">
                <r.icon size={18} />
              </div>
              <p className="mt-5 font-display text-xl font-medium text-background">{r.role}</p>
              <p className="mt-2 text-sm leading-relaxed text-background/55">{r.body}</p>
            </motion.div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}

function TrustStrip() {
  const items = [
    { icon: KeyRound, label: 'Supabase-backed authentication' },
    { icon: ShieldAlert, label: 'Row-level security on every table' },
    { icon: History, label: 'Append-only audit logging' },
    { icon: Globe2, label: 'Reachable from anywhere on your network' },
  ];
  return (
    <Reveal variants={stagger} className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-6 py-16 sm:grid-cols-4">
      {items.map((it) => (
        <motion.div key={it.label} variants={fadeUp} className="flex flex-col items-start gap-2">
          <it.icon size={18} className="text-primary-500" />
          <p className="text-sm text-text-secondary">{it.label}</p>
        </motion.div>
      ))}
    </Reveal>
  );
}

function FinalCta() {
  return (
    <section className="relative overflow-hidden px-6 py-28">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="blob animate-blob left-1/3 top-0 h-[26rem] w-[26rem] bg-primary-300/25" />
      </div>
      <Reveal className="mx-auto max-w-3xl text-center">
        <h2 className="font-display text-4xl font-medium leading-tight text-text-primary sm:text-5xl">
          Give your policies something they rarely have: <em className="italic text-primary-600">proof</em>.
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-text-secondary">
          Create your workspace, request the role you need, and an admin will get you in — most
          teams are up and running the same day.
        </p>
        <div className="mt-9 flex flex-col items-center gap-4">
          <Link to="/signup" className="btn-primary px-7 py-3 text-base">
            Create your workspace <ArrowUpRight size={18} />
          </Link>
          <Link to="/login" className="text-sm font-medium text-text-secondary hover:text-text-primary">
            Already have an account? Sign in
          </Link>
        </div>
      </Reveal>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border px-6 py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
        <div className="flex items-center gap-2">
          <Logo size={28} />
          <span className="font-display text-sm font-semibold text-text-primary">SPRAT</span>
        </div>
        <p className="text-xs text-text-muted">© {new Date().getFullYear()} SPRAT. Security &amp; Privacy Requirements Analysis Tool.</p>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <div className="bg-background">
      <NavBar />
      <Hero />
      <RegulationMarquee />
      <MarketSection />
      <ProductSection />
      <RolesSection />
      <TrustStrip />
      <FinalCta />
      <Footer />
    </div>
  );
}
