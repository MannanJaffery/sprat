import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Check, X, Tags } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import QueryState from '../../components/QueryState';
import EmptyState from '../../components/EmptyState';
import Badge from '../../components/Badge';
import { TextField, TextAreaField } from '../../components/FormField';
import { useAuth } from '../../hooks/useAuth';
import * as classificationsApi from '../../api/classifications';
import { getErrorMessage } from '../../api/client';

const REQUEST_VARIANT = { pending: 'warning', approved: 'success', rejected: 'danger' };

// FR9 (FR-GSM 5/6): project managers add goal classification dimensions; analysts
// can request one and a PM approves or rejects it.
export default function ClassificationTypesPage() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isManager = user?.role === 'admin' || user?.role === 'project_manager';

  const typesQuery = useQuery({
    queryKey: ['classification-types', projectId],
    queryFn: () => classificationsApi.listTypes(projectId),
  });
  const requestsQuery = useQuery({
    queryKey: ['classification-requests', projectId],
    queryFn: () => classificationsApi.listRequests(projectId),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['classification-types', projectId] });
    queryClient.invalidateQueries({ queryKey: ['classification-requests', projectId] });
  };

  const createType = useMutation({
    mutationFn: (payload) => classificationsApi.createType(projectId, payload),
    onSuccess: () => {
      toast.success('Classification dimension added.');
      invalidate();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const createRequest = useMutation({
    mutationFn: (payload) => classificationsApi.createRequest(projectId, payload),
    onSuccess: () => {
      toast.success('Request submitted for the project manager to review.');
      invalidate();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const decide = useMutation({
    mutationFn: ({ id, decision }) => classificationsApi.decideRequest(projectId, id, decision),
    onSuccess: (_, vars) => {
      toast.success(`Request ${vars.decision}.`);
      invalidate();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Classification Dimensions"
        description="Goal classification categories beyond the three built-in ones (FR-GSM 5/6)."
      />

      <div className="card space-y-3">
        <h2 className="text-base font-semibold text-text-primary">Active dimensions</h2>
        <div className="space-y-2">
          <BuiltIn label="Policy Goal vs. Scenario Goal" options={['policy', 'scenario']} />
          <BuiltIn label="Observable vs. Unobservable" options={['observable', 'unobservable']} />
          <BuiltIn label="Protection vs. Vulnerability" options={['protection', 'vulnerability']} />
        </div>
        <QueryState query={typesQuery}>
          {(types) =>
            types.length === 0 ? (
              <p className="text-sm text-text-secondary">No project-defined dimensions yet.</p>
            ) : (
              <div className="space-y-2">
                {types.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                  >
                    <span className="text-sm font-medium text-text-primary">{t.label}</span>
                    <span className="flex flex-wrap gap-1.5">
                      {t.options.map((o) => (
                        <Badge key={o} variant="neutral">
                          {o}
                        </Badge>
                      ))}
                      <Badge variant="primary">project-defined</Badge>
                    </span>
                  </div>
                ))}
              </div>
            )
          }
        </QueryState>
      </div>

      {isManager ? (
        <DimensionForm
          title="Add a dimension"
          submitLabel="Add dimension"
          submitting={createType.isPending}
          onSubmit={(payload) => createType.mutate(payload)}
        />
      ) : (
        <DimensionForm
          title="Request a new dimension"
          submitLabel="Submit request"
          withRationale
          submitting={createRequest.isPending}
          onSubmit={(payload) => createRequest.mutate(payload)}
        />
      )}

      <div className="card space-y-3">
        <h2 className="text-base font-semibold text-text-primary">Requests</h2>
        <QueryState query={requestsQuery}>
          {(requests) =>
            requests.length === 0 ? (
              <EmptyState icon={Tags} title="No requests" />
            ) : (
              <div className="space-y-2">
                {requests.map((r) => (
                  <div key={r.id} className="rounded-lg border border-border p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-text-primary">{r.label}</span>
                      <Badge variant={REQUEST_VARIANT[r.status]}>{r.status}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-text-secondary">
                      Options: {r.options.join(', ')} · by {r.requested_by_name}
                      {r.rationale ? ` · “${r.rationale}”` : ''}
                    </p>
                    {isManager && r.status === 'pending' && (
                      <div className="mt-2 flex gap-2">
                        <button
                          className="btn-secondary"
                          disabled={decide.isPending}
                          onClick={() => decide.mutate({ id: r.id, decision: 'approved' })}
                        >
                          <Check size={14} /> Approve
                        </button>
                        <button
                          className="btn-secondary"
                          disabled={decide.isPending}
                          onClick={() => decide.mutate({ id: r.id, decision: 'rejected' })}
                        >
                          <X size={14} /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          }
        </QueryState>
      </div>
    </div>
  );
}

function BuiltIn({ label, options }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
      <span className="text-sm font-medium text-text-primary">{label}</span>
      <span className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <Badge key={o} variant="neutral">
            {o}
          </Badge>
        ))}
        <Badge variant="neutral">built-in</Badge>
      </span>
    </div>
  );
}

function DimensionForm({ title, submitLabel, withRationale, submitting, onSubmit }) {
  const [label, setLabel] = useState('');
  const [optionsText, setOptionsText] = useState('');
  const [rationale, setRationale] = useState('');

  return (
    <form
      className="card space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const options = optionsText
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        onSubmit({ label, options, ...(withRationale ? { rationale } : {}) });
        setLabel('');
        setOptionsText('');
        setRationale('');
      }}
    >
      <h2 className="text-base font-semibold text-text-primary">{title}</h2>
      <TextField
        label="Dimension label"
        required
        placeholder="e.g. Data Sensitivity"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
      />
      <TextField
        label="Options (comma-separated, at least two)"
        required
        placeholder="low, moderate, high"
        value={optionsText}
        onChange={(e) => setOptionsText(e.target.value)}
      />
      {withRationale && (
        <TextAreaField
          label="Rationale (optional)"
          value={rationale}
          onChange={(e) => setRationale(e.target.value)}
        />
      )}
      <button type="submit" className="btn-primary" disabled={submitting}>
        <Plus size={16} /> {submitLabel}
      </button>
    </form>
  );
}
