import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowLeft, Pencil, Trash2, Link2, X, GitBranch } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import QueryState from '../../components/QueryState';
import ConfirmDialog from '../../components/ConfirmDialog';
import Modal from '../../components/Modal';
import Badge from '../../components/Badge';
import ScenarioForm from '../../components/ScenarioForm';
import { SelectField } from '../../components/FormField';
import { useAuth } from '../../hooks/useAuth';
import * as scenariosApi from '../../api/scenarios';
import * as goalsApi from '../../api/goals';
import { getErrorMessage } from '../../api/client';

const STATUS_VARIANT = { draft: 'neutral', active: 'primary', resolved: 'success' };

const FIELD_LABELS = {
  sources: 'Sources',
  actors: 'Actor(s)',
  events: 'Event(s)',
  actions: 'Action(s)',
  obstacles: 'Obstacle(s)',
  constraints: 'Constraint(s)',
  pre_conditions: 'Pre-condition(s)',
  post_conditions: 'Post-condition(s)',
  issues: 'Issue(s)',
  requirements_text: 'Requirements',
};

function LinkGoalModal({ open, onClose, projectId, scenarioId, linkedGoalIds }) {
  const queryClient = useQueryClient();
  const [goalId, setGoalId] = useState('');
  const goalsQuery = useQuery({
    queryKey: ['goals', projectId, ''],
    queryFn: () => goalsApi.listGoals(projectId),
    enabled: open,
  });

  const link = useMutation({
    mutationFn: () => scenariosApi.linkGoal(projectId, scenarioId, Number(goalId)),
    onSuccess: () => {
      toast.success('Goal linked to scenario.');
      queryClient.invalidateQueries({ queryKey: ['scenario', projectId, scenarioId] });
      onClose();
      setGoalId('');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const candidates = (goalsQuery.data || []).filter((g) => !linkedGoalIds.includes(g.id));

  return (
    <Modal open={open} onClose={onClose} title="Link an existing goal" size="sm">
      <SelectField label="Goal" value={goalId} onChange={(e) => setGoalId(e.target.value)}>
        <option value="">Select a goal…</option>
        {candidates.map((g) => (
          <option key={g.id} value={g.id}>
            {g.goal_code} — {g.description}
          </option>
        ))}
      </SelectField>
      <div className="mt-4 flex justify-end gap-3">
        <button className="btn-secondary" onClick={onClose}>
          Cancel
        </button>
        <button className="btn-primary" disabled={!goalId || link.isPending} onClick={() => link.mutate()}>
          {link.isPending ? 'Linking…' : 'Link goal'}
        </button>
      </div>
    </Modal>
  );
}

export default function ScenarioDetailPage() {
  const { projectId, scenarioId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const canManage = ['admin', 'project_manager', 'analyst'].includes(user?.role);

  const [editing, setEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);

  const scenarioQuery = useQuery({
    queryKey: ['scenario', projectId, scenarioId],
    queryFn: () => scenariosApi.getScenario(projectId, scenarioId),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['scenario', projectId, scenarioId] });

  const updateScenario = useMutation({
    mutationFn: (payload) => scenariosApi.updateScenario(projectId, scenarioId, payload),
    onSuccess: () => {
      toast.success('Scenario updated.');
      invalidate();
      setEditing(false);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const deleteScenario = useMutation({
    mutationFn: () => scenariosApi.deleteScenario(projectId, scenarioId),
    onSuccess: () => {
      toast.success('Scenario deleted.');
      queryClient.invalidateQueries({ queryKey: ['scenarios', projectId] });
      navigate(`/projects/${projectId}/scenarios`);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const unlinkGoal = useMutation({
    mutationFn: (goalId) => scenariosApi.unlinkGoal(projectId, scenarioId, goalId),
    onSuccess: () => {
      toast.success('Goal unlinked.');
      invalidate();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate(`/projects/${projectId}/scenarios`)}
        className="flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary"
      >
        <ArrowLeft size={14} /> Back to scenarios
      </button>

      <QueryState query={scenarioQuery}>
        {(scenario) => (
          <>
            <PageHeader
              icon={GitBranch}
              title={scenario.name}
              description={<Badge variant={STATUS_VARIANT[scenario.status]}>{scenario.status}</Badge>}
              actions={
                canManage && (
                  <>
                    <button className="btn-secondary" onClick={() => setEditing((v) => !v)}>
                      <Pencil size={16} /> {editing ? 'Cancel edit' : 'Edit'}
                    </button>
                    <button className="btn-danger" onClick={() => setDeleteOpen(true)}>
                      <Trash2 size={16} /> Delete
                    </button>
                  </>
                )
              }
            />

            {editing ? (
              <div className="card">
                <ScenarioForm
                  initialValues={{
                    name: scenario.name,
                    sources: scenario.sources || '',
                    actors: scenario.actors || '',
                    events: scenario.events || '',
                    actions: scenario.actions || '',
                    obstacles: scenario.obstacles || '',
                    constraints: scenario.constraints || '',
                    preConditions: scenario.pre_conditions || '',
                    postConditions: scenario.post_conditions || '',
                    status: scenario.status,
                    issues: scenario.issues || '',
                    requirementsText: scenario.requirements_text || '',
                  }}
                  onSubmit={(values) => updateScenario.mutate(values)}
                  submitting={updateScenario.isPending}
                  submitLabel="Save changes"
                />
              </div>
            ) : (
              <div className="card grid grid-cols-1 gap-4 sm:grid-cols-2">
                {Object.entries(FIELD_LABELS).map(([field, label]) => (
                  <div key={field}>
                    <p className="text-xs uppercase tracking-wide text-text-secondary">{label}</p>
                    <p className="text-sm text-text-primary">{scenario[field] || '—'}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="card space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-text-primary">Linked goals</h2>
                {canManage && (
                  <button className="btn-secondary" onClick={() => setLinkOpen(true)}>
                    <Link2 size={16} /> Link goal
                  </button>
                )}
              </div>
              {scenario.goals.length === 0 ? (
                <p className="text-sm text-text-secondary">No goals linked to this scenario yet.</p>
              ) : (
                <ul className="space-y-2">
                  {scenario.goals.map((g) => (
                    <li
                      key={g.id}
                      className="flex items-center justify-between rounded-lg border border-border bg-surface-soft px-3 py-2.5 text-sm"
                    >
                      <span className="text-text-primary">
                        <span className="rounded bg-surface px-1.5 py-0.5 font-mono text-xs text-text-secondary">
                          {g.goal_code}
                        </span>{' '}
                        {g.description}
                      </span>
                      {canManage && (
                        <button
                          onClick={() => unlinkGoal.mutate(g.id)}
                          className="rounded-md p-1 text-text-secondary hover:bg-surface hover:text-danger"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <ConfirmDialog
              open={deleteOpen}
              title="Delete scenario"
              message="This permanently removes the scenario. This cannot be undone."
              danger
              confirmLabel="Delete"
              onCancel={() => setDeleteOpen(false)}
              onConfirm={() => deleteScenario.mutate()}
              loading={deleteScenario.isPending}
            />

            <LinkGoalModal
              open={linkOpen}
              onClose={() => setLinkOpen(false)}
              projectId={projectId}
              scenarioId={scenarioId}
              linkedGoalIds={scenario.goals.map((g) => g.id)}
            />
          </>
        )}
      </QueryState>
    </div>
  );
}
