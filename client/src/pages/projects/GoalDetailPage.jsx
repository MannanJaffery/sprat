import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowLeft, Pencil, Trash2, Repeat } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import QueryState from '../../components/QueryState';
import ConfirmDialog from '../../components/ConfirmDialog';
import Modal from '../../components/Modal';
import Badge from '../../components/Badge';
import GoalForm from '../../components/GoalForm';
import ClassificationPanel from '../../components/ClassificationPanel';
import TraceabilityPanel from '../../components/TraceabilityPanel';
import { SelectField } from '../../components/FormField';
import { useAuth } from '../../hooks/useAuth';
import * as goalsApi from '../../api/goals';
import * as documentsApi from '../../api/documents';
import { getErrorMessage } from '../../api/client';

const TABS = ['Details', 'Classification & Compare', 'Traceability'];

function ReplaceGoalModal({ open, onClose, projectId, goalId, allGoals }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [newGoalId, setNewGoalId] = useState('');

  const replace = useMutation({
    mutationFn: () => goalsApi.replaceGoal(projectId, goalId, Number(newGoalId)),
    onSuccess: (result) => {
      toast.success(
        `Replaced. ${result.policiesUpdated} policy link(s) and ${result.scenariosUpdated} scenario link(s) updated.`
      );
      queryClient.invalidateQueries({ queryKey: ['goals', projectId] });
      onClose();
      navigate(`/projects/${projectId}/goals/${newGoalId}`);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const candidates = allGoals.filter((g) => g.id !== Number(goalId));

  return (
    <Modal open={open} onClose={onClose} title="Replace this goal" size="sm">
      <p className="mb-4 text-sm text-text-secondary">
        This goal will be deleted and every policy/scenario it appears in will be automatically
        re-linked to the replacement goal (FR-GSM 9).
      </p>
      <SelectField label="Replacement goal" value={newGoalId} onChange={(e) => setNewGoalId(e.target.value)}>
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
        <button
          className="btn-danger"
          disabled={!newGoalId || replace.isPending}
          onClick={() => replace.mutate()}
        >
          {replace.isPending ? 'Replacing…' : 'Replace goal'}
        </button>
      </div>
    </Modal>
  );
}

export default function GoalDetailPage() {
  const { projectId, goalId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const canManage = ['admin', 'project_manager', 'analyst'].includes(user?.role);

  const [tab, setTab] = useState(TABS[0]);
  const [editing, setEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [replaceOpen, setReplaceOpen] = useState(false);

  const goalQuery = useQuery({
    queryKey: ['goal', projectId, goalId],
    queryFn: () => goalsApi.getGoal(projectId, goalId),
  });
  const documentsQuery = useQuery({
    queryKey: ['documents', projectId],
    queryFn: () => documentsApi.listDocuments(projectId),
  });
  const allGoalsQuery = useQuery({
    queryKey: ['goals', projectId, ''],
    queryFn: () => goalsApi.listGoals(projectId),
    enabled: replaceOpen,
  });

  const updateGoal = useMutation({
    mutationFn: (payload) => goalsApi.updateGoal(projectId, goalId, payload),
    onSuccess: () => {
      toast.success('Goal updated.');
      queryClient.invalidateQueries({ queryKey: ['goal', projectId, goalId] });
      setEditing(false);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const deleteGoal = useMutation({
    mutationFn: () => goalsApi.deleteGoal(projectId, goalId),
    onSuccess: () => {
      toast.success('Goal deleted.');
      queryClient.invalidateQueries({ queryKey: ['goals', projectId] });
      navigate(`/projects/${projectId}/goals`);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate(`/projects/${projectId}/goals`)}
        className="flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary"
      >
        <ArrowLeft size={14} /> Back to goals
      </button>

      <QueryState query={goalQuery}>
        {(goal) => (
          <>
            <PageHeader
              title={`${goal.goal_code} — ${goal.description}`}
              description={`Context: ${goal.context_excerpt || 'not recorded'}`}
              actions={
                canManage &&
                tab === 'Details' && (
                  <>
                    <button className="btn-secondary" onClick={() => setEditing((v) => !v)}>
                      <Pencil size={16} /> {editing ? 'Cancel edit' : 'Edit'}
                    </button>
                    <button className="btn-secondary" onClick={() => setReplaceOpen(true)}>
                      <Repeat size={16} /> Replace
                    </button>
                    <button className="btn-danger" onClick={() => setDeleteOpen(true)}>
                      <Trash2 size={16} /> Delete
                    </button>
                  </>
                )
              }
            />

            <div className="flex gap-2 border-b border-border">
              {TABS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`border-b-2 px-3 py-2 text-sm font-medium ${
                    tab === t
                      ? 'border-primary-600 text-primary-700'
                      : 'border-transparent text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {tab === 'Details' &&
              (editing ? (
                <div className="card">
                  <GoalForm
                    documents={documentsQuery.data || []}
                    initialValues={{
                      documentId: goal.document_id,
                      goalCode: goal.goal_code,
                      description: goal.description,
                      taxonomyCategory: goal.taxonomy_category,
                      taxonomySubtype: goal.taxonomy_subtype,
                      granularity: goal.granularity,
                      observable: goal.observable,
                      actor: goal.actor || '',
                      contextExcerpt: goal.context_excerpt || '',
                      relevantLegislation: goal.relevant_legislation || '',
                      subjectClassifications: goal.subjectClassifications,
                    }}
                    lockDocument
                    onSubmit={(values) => updateGoal.mutate(values)}
                    submitting={updateGoal.isPending}
                    submitLabel="Save changes"
                  />
                </div>
              ) : (
                <div className="card space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={goal.taxonomy_category === 'protection' ? 'primary' : 'warning'}>
                      {goal.taxonomy_category} / {goal.taxonomy_subtype}
                    </Badge>
                    <Badge variant="neutral">{goal.granularity} goal</Badge>
                    <Badge variant={goal.observable ? 'success' : 'neutral'}>
                      {goal.observable ? 'observable' : 'unobservable'}
                    </Badge>
                  </div>
                  <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-text-secondary">Actor</dt>
                      <dd className="font-medium text-text-primary">{goal.actor || '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-text-secondary">Relevant legislation</dt>
                      <dd className="font-medium text-text-primary">
                        {goal.relevant_legislation || '—'}
                      </dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-text-secondary">Subject classification</dt>
                      <dd className="mt-1 flex flex-wrap gap-1.5">
                        {goal.subjectClassifications.map((s) => (
                          <Badge key={s} variant="neutral">
                            {s}
                          </Badge>
                        ))}
                      </dd>
                    </div>
                  </dl>
                </div>
              ))}

            {tab === 'Classification & Compare' && (
              <ClassificationPanel projectId={projectId} goalId={goalId} />
            )}

            {tab === 'Traceability' && <TraceabilityPanel projectId={projectId} goalId={goalId} />}

            <ConfirmDialog
              open={deleteOpen}
              title="Delete goal"
              message="This permanently removes the goal and its links to policies and scenarios. This cannot be undone."
              danger
              confirmLabel="Delete"
              onCancel={() => setDeleteOpen(false)}
              onConfirm={() => deleteGoal.mutate()}
              loading={deleteGoal.isPending}
            />

            <ReplaceGoalModal
              open={replaceOpen}
              onClose={() => setReplaceOpen(false)}
              projectId={projectId}
              goalId={goalId}
              allGoals={allGoalsQuery.data || []}
            />
          </>
        )}
      </QueryState>
    </div>
  );
}
