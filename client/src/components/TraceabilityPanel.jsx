import { useQuery } from '@tanstack/react-query';
import { FileText, GitBranch } from 'lucide-react';
import QueryState from './QueryState';
import * as goalsApi from '../api/goals';

// FR-GSM 10 / FR6: every policy and scenario a goal traces to.
export default function TraceabilityPanel({ projectId, goalId }) {
  const query = useQuery({
    queryKey: ['traceability', projectId, goalId],
    queryFn: () => goalsApi.getTraceability(projectId, goalId),
  });

  return (
    <QueryState query={query}>
      {(data) => (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="card space-y-3">
            <h2 className="flex items-center gap-2 text-base font-semibold text-text-primary">
              <FileText size={18} /> Policies ({data.policies.length})
            </h2>
            {data.policies.length === 0 ? (
              <p className="text-sm text-text-secondary">Not linked to any policy document.</p>
            ) : (
              <ul className="space-y-2">
                {data.policies.map((p) => (
                  <li
                    key={p.document_id}
                    className="flex items-center justify-between rounded-lg bg-background px-3 py-2 text-sm"
                  >
                    <span className="text-text-primary">{p.document_name}</span>
                    <span className="text-text-secondary">×{p.occurrence_count}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card space-y-3">
            <h2 className="flex items-center gap-2 text-base font-semibold text-text-primary">
              <GitBranch size={18} /> Scenarios ({data.scenarios.length})
            </h2>
            {data.scenarios.length === 0 ? (
              <p className="text-sm text-text-secondary">Not linked to any scenario.</p>
            ) : (
              <ul className="space-y-2">
                {data.scenarios.map((s) => (
                  <li key={s.scenario_id} className="rounded-lg bg-background px-3 py-2 text-sm text-text-primary">
                    {s.scenario_name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </QueryState>
  );
}
