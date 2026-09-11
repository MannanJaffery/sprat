// Per-feature mockups for the landing page's Product section — each renders
// a small, believable slice of the actual product instead of a generic
// icon-in-a-box placeholder, so every feature gets its own concrete visual.
import { ArrowDown, FileText, ScanSearch, AlertTriangle, Lock } from 'lucide-react';

export function DocumentMiningVisual() {
  return (
    <div className="card !p-5">
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <FileText size={13} className="text-text-muted" />
        <span className="text-xs font-medium text-text-muted">retention-policy.pdf · page 3</span>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-text-secondary">
        We retain payment records for{' '}
        <mark className="rounded bg-primary-200/70 px-1 text-text-primary">
          no longer than 24 months after account closure
        </mark>
        , after which they are permanently deleted from all systems.
      </p>
      <div className="mt-3 flex justify-center text-primary-400">
        <ArrowDown size={14} />
      </div>
      <div className="mt-3 flex items-center justify-between rounded-lg border border-primary-200 bg-primary-50 px-3 py-2.5">
        <div>
          <p className="text-xs font-semibold text-primary-700">Goal extracted</p>
          <p className="text-xs text-text-secondary">Data retention limit — 24 months</p>
        </div>
        <ScanSearch size={16} className="shrink-0 text-primary-600" />
      </div>
    </div>
  );
}

const TAXONOMY_GROUPS = [
  { cat: 'Data Minimization', tags: ['Retention limit', 'Collection scope'] },
  { cat: 'User Rights', tags: ['Access', 'Export', 'Erasure'] },
  { cat: 'Breach Notification', tags: ['72-hour rule'] },
];

export function TaxonomyVisual() {
  return (
    <div className="card space-y-4 !p-5">
      <p className="text-xs font-medium text-text-muted">Classification taxonomy</p>
      {TAXONOMY_GROUPS.map((group) => (
        <div key={group.cat}>
          <p className="text-xs font-semibold text-text-primary">{group.cat}</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {group.tags.map((t) => (
              <span key={t} className="badge border border-border bg-surface-soft text-text-secondary">
                {t}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

const RECONCILIATION_ROWS = [
  { who: 'Analyst A', tag: 'Data Minimization', match: true },
  { who: 'Analyst B', tag: 'Data Minimization', match: true },
  { who: 'Analyst C', tag: 'Purpose Limitation', match: false },
];

export function ReconciliationVisual() {
  return (
    <div className="card !p-5">
      <p className="text-xs font-medium text-text-muted">Independent classification</p>
      <div className="mt-3 space-y-2">
        {RECONCILIATION_ROWS.map((row) => (
          <div key={row.who} className="flex items-center justify-between rounded-lg border border-border/70 px-3 py-2">
            <span className="text-xs text-text-secondary">{row.who}</span>
            <span className={`badge ${row.match ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
              {row.tag}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-warning">
        <AlertTriangle size={12} /> 1 disagreement flagged for review
      </div>
    </div>
  );
}

export function ScenarioGraphVisual() {
  return (
    <div className="card !p-5">
      <p className="text-xs font-medium text-text-muted">Goal → scenario trace</p>
      <div className="mt-4 flex flex-col items-center gap-3">
        <div className="rounded-lg border border-primary-300 bg-primary-50 px-3 py-2 text-center text-xs font-semibold text-primary-700">
          Notify users of a breach within 72 hours
        </div>
        <div className="h-6 w-px bg-border" />
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-background px-3 py-2 text-xs text-text-secondary">
            Scenario: unauthorized database access detected
          </div>
          <div className="rounded-lg border border-border bg-background px-3 py-2 text-xs text-text-secondary">
            Scenario: vendor reports leaked credentials
          </div>
        </div>
      </div>
    </div>
  );
}

const AUDIT_ENTRIES = [
  { t: '09:41', who: 'A. Ferreira', action: 'classified goal as Breach Notification' },
  { t: '09:38', who: 'System', action: 'auto-approved matching classification' },
  { t: '09:12', who: 'M. Okoye', action: 'added scenario: vendor credential leak' },
];

export function AuditTrailVisual() {
  return (
    <div className="card !p-5">
      <p className="text-xs font-medium text-text-muted">Audit log · append-only</p>
      <div className="mt-3 space-y-3">
        {AUDIT_ENTRIES.map((e) => (
          <div key={e.t} className="flex gap-3">
            <span className="mt-0.5 shrink-0 font-mono text-[10px] text-text-muted">{e.t}</span>
            <div className="flex-1 border-l border-border pl-3">
              <p className="text-xs leading-relaxed text-text-secondary">
                <span className="font-medium text-text-primary">{e.who}</span> {e.action}
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-1.5 text-xs text-text-muted">
        <Lock size={11} /> Immutable — entries cannot be edited or deleted
      </div>
    </div>
  );
}
