import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Lock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import QueryState from './QueryState';
import Badge from './Badge';
import { CLASSIFICATION_TYPE_LABELS } from '../constants/taxonomy';
import * as goalsApi from '../api/goals';
import { getErrorMessage } from '../api/client';
import { useAuth } from '../hooks/useAuth';

const TYPES = Object.keys(CLASSIFICATION_TYPE_LABELS);

// FR-ADM 7: each analyst classifies a goal independently; the tool withholds other
// analysts' choices until the current analyst submits their own, then auto-diffs results.
export default function ClassificationPanel({ projectId, goalId }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAnalyst = user.role === 'analyst';
  const canSeeDiff = user.role === 'admin' || user.role === 'project_manager';

  const optionsQuery = useQuery({
    queryKey: ['classification-options', projectId, goalId],
    queryFn: () => goalsApi.getClassificationOptions(projectId, goalId),
  });
  const classificationsQuery = useQuery({
    queryKey: ['classifications', projectId, goalId],
    queryFn: () => goalsApi.getClassifications(projectId, goalId),
  });
  const diffQuery = useQuery({
    queryKey: ['classifications-diff', projectId, goalId],
    queryFn: () => goalsApi.getClassificationDiff(projectId, goalId),
    enabled: canSeeDiff,
  });

  const [values, setValues] = useState({});

  const submit = useMutation({
    mutationFn: () => goalsApi.submitClassifications(projectId, goalId, values),
    onSuccess: () => {
      toast.success('Classification submitted.');
      queryClient.invalidateQueries({ queryKey: ['classifications', projectId, goalId] });
      queryClient.invalidateQueries({ queryKey: ['classifications-diff', projectId, goalId] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const allSelected = TYPES.every((t) => values[t]);

  return (
    <div className="space-y-6">
      {isAnalyst && (
        <div className="card space-y-4">
          <h2 className="text-base font-semibold text-text-primary">Submit your classification</h2>
          <QueryState query={optionsQuery}>
            {(options) => (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {options.types.map((type) => (
                  <div key={type}>
                    <label className="label">{CLASSIFICATION_TYPE_LABELS[type]}</label>
                    <div className="flex gap-2">
                      {options.valueOptions[type].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setValues((v) => ({ ...v, [type]: opt }))}
                          className={`btn-secondary flex-1 ${
                            values[type] === opt ? '!bg-primary-600 !text-white' : ''
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </QueryState>
          <button
            className="btn-primary"
            disabled={!allSelected || submit.isPending}
            onClick={() => submit.mutate()}
          >
            {submit.isPending ? 'Submitting…' : 'Submit classification'}
          </button>
        </div>
      )}

      <div className="card space-y-4">
        <h2 className="text-base font-semibold text-text-primary">Analyst classifications</h2>
        <QueryState query={classificationsQuery}>
          {(data) =>
            data.withheld ? (
              <div className="flex items-center gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                <Lock size={16} />
                Other analysts&apos; classifications are withheld until you submit your own, to
                prevent bias.
              </div>
            ) : data.entries.length === 0 ? (
              <p className="text-sm text-text-secondary">No classifications submitted yet.</p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border text-xs uppercase text-text-secondary">
                  <tr>
                    <th className="py-2">Analyst</th>
                    <th className="py-2">Dimension</th>
                    <th className="py-2">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {data.entries.map((e, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td className="py-2 text-text-primary">{e.analyst_name || 'You'}</td>
                      <td className="py-2 text-text-secondary">
                        {CLASSIFICATION_TYPE_LABELS[e.classification_type]}
                      </td>
                      <td className="py-2 font-medium text-text-primary">{e.classification_value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          }
        </QueryState>
      </div>

      {canSeeDiff && (
        <div className="card space-y-4">
          <h2 className="text-base font-semibold text-text-primary">Reconciliation view</h2>
          <QueryState query={diffQuery}>
            {(diff) => (
              <div className="space-y-3">
                {TYPES.map((type) => {
                  const info = diff[type];
                  if (!info || info.entries.length === 0) return null;
                  return (
                    <div key={type} className="rounded-lg border border-border p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-medium text-text-primary">
                          {CLASSIFICATION_TYPE_LABELS[type]}
                        </span>
                        {info.hasConflict ? (
                          <Badge variant="danger">
                            <AlertTriangle size={12} className="mr-1" /> Conflict
                          </Badge>
                        ) : (
                          <Badge variant="success">
                            <CheckCircle2 size={12} className="mr-1" /> Agreement
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 text-sm text-text-secondary">
                        {info.entries.map((e) => (
                          <span key={e.analystId} className="rounded-md bg-background px-2 py-1">
                            {e.analystName}: <strong className="text-text-primary">{e.value}</strong>
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </QueryState>
        </div>
      )}
    </div>
  );
}
