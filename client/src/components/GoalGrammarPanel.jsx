import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, XCircle } from 'lucide-react';
import QueryState from './QueryState';
import Badge from './Badge';
import * as goalsApi from '../api/goals';

const VERDICT_VARIANT = { Excellent: 'success', Good: 'primary', 'Needs work': 'warning', Poor: 'danger' };

function Metric({ label, value }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-text-secondary">{label}</p>
      <p className="text-xl font-bold text-text-primary">{value}</p>
    </div>
  );
}

// Rule-based goal statement conformance check (no AI) — via ../services/grammarCheck server-side.
export default function GoalGrammarPanel({ projectId, goalId }) {
  const query = useQuery({
    queryKey: ['grammar-check', projectId, goalId],
    queryFn: () => goalsApi.getGrammarCheck(projectId, goalId),
  });

  return (
    <QueryState query={query}>
      {(data) => (
        <div className="card space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-text-primary">Goal statement conformance</h2>
              <p className="mt-0.5 text-xs text-text-muted">Rule-based check — not AI-generated</p>
            </div>
            <div className="text-right">
              <p className="font-display text-3xl font-medium text-text-primary">{data.score}</p>
              <Badge variant={VERDICT_VARIANT[data.verdict] || 'neutral'}>{data.verdict}</Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-border pt-4 sm:grid-cols-4">
            <Metric label="Words" value={data.wordCount} />
            <Metric label="Sentences" value={data.sentenceCount} />
          </div>

          <ul className="space-y-3 border-t border-border pt-4">
            {data.checks.map((c) => (
              <li key={c.key} className="flex items-start gap-2.5">
                {c.pass ? (
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-success" />
                ) : (
                  <XCircle size={16} className="mt-0.5 shrink-0 text-warning" />
                )}
                <div>
                  <p className="text-sm font-medium text-text-primary">{c.label}</p>
                  <p className="text-xs text-text-secondary">{c.message}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </QueryState>
  );
}
