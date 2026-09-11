import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ShieldAlert, CheckCircle2 } from 'lucide-react';
import Badge from './Badge';
import * as aiApi from '../api/ai';
import { getErrorMessage } from '../api/client';

const SEVERITY_VARIANT = { high: 'danger', medium: 'warning', low: 'neutral' };

export default function ConflictDetectorCard({ projectId }) {
  const detect = useMutation({
    mutationFn: () => aiApi.detectGoalConflicts(projectId),
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  return (
    <div className="card space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-danger/10 text-danger">
            <ShieldAlert size={17} />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary">Conflict detector</p>
            <p className="text-xs text-text-muted">AI-assisted — checks every goal you can see against every other</p>
          </div>
        </div>
        <button className="btn-secondary" onClick={() => detect.mutate()} disabled={detect.isPending}>
          {detect.isPending ? 'Checking…' : detect.data ? 'Re-check' : 'Detect conflicts'}
        </button>
      </div>

      {detect.data && (
        <div className="space-y-3 border-t border-border pt-4">
          <p className="text-xs text-text-muted">
            Checked {detect.data.checked} goal{detect.data.checked === 1 ? '' : 's'}
            {detect.data.truncated ? ' (largest 80 only).' : '.'}
          </p>

          {detect.data.conflicts.length === 0 ? (
            <p className="flex items-center gap-1.5 text-sm font-medium text-success">
              <CheckCircle2 size={15} /> No conflicts found.
            </p>
          ) : (
            detect.data.conflicts.map((c, i) => (
              <div key={i} className="rounded-lg border border-border/70 p-3.5">
                <Badge variant={SEVERITY_VARIANT[c.severity] || 'neutral'}>{c.severity} severity</Badge>
                <div className="mt-2.5 space-y-1.5 text-sm text-text-primary">
                  <p>
                    <span className="mr-1.5 rounded bg-surface-soft px-1.5 py-0.5 font-mono text-xs text-text-secondary">
                      {c.goalA.goalCode}
                    </span>
                    {c.goalA.description}
                  </p>
                  <p>
                    <span className="mr-1.5 rounded bg-surface-soft px-1.5 py-0.5 font-mono text-xs text-text-secondary">
                      {c.goalB.goalCode}
                    </span>
                    {c.goalB.description}
                  </p>
                </div>
                <p className="mt-2.5 text-xs leading-relaxed text-text-secondary">{c.explanation}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
