import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Target, Search } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import QueryState from '../../components/QueryState';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import Badge from '../../components/Badge';
import GoalForm from '../../components/GoalForm';
import { useAuth } from '../../hooks/useAuth';
import * as goalsApi from '../../api/goals';
import * as documentsApi from '../../api/documents';
import { getErrorMessage } from '../../api/client';

export default function GoalsListPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const canManage = ['admin', 'project_manager', 'analyst'].includes(user?.role);

  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);

  const goalsQuery = useQuery({
    queryKey: ['goals', projectId, search],
    queryFn: () => goalsApi.listGoals(projectId, search ? { search } : {}),
  });
  const documentsQuery = useQuery({
    queryKey: ['documents', projectId],
    queryFn: () => documentsApi.listDocuments(projectId),
  });

  const createGoal = useMutation({
    mutationFn: (payload) =>
      goalsApi.createGoal(projectId, { ...payload, documentId: Number(payload.documentId) }),
    onSuccess: () => {
      toast.success('Goal added.');
      queryClient.invalidateQueries({ queryKey: ['goals', projectId] });
      setCreateOpen(false);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Goals"
        description="Objectives mined from policy documents, classified by taxonomy and subject."
        actions={
          canManage && (
            <button className="btn-primary" onClick={() => setCreateOpen(true)}>
              <Plus size={16} /> Add goal
            </button>
          )
        }
      />

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
        <input
          className="input pl-9"
          placeholder="Search by description, actor, or Goal ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <QueryState query={goalsQuery}>
        {(goals) =>
          goals.length === 0 ? (
            <EmptyState
              icon={Target}
              title="No goals yet"
              description="Add a goal derived from one of this project's policy documents."
            />
          ) : (
            <div className="card divide-y divide-border p-0">
              {goals.map((g) => (
                <button
                  key={g.id}
                  onClick={() => navigate(`/projects/${projectId}/goals/${g.id}`)}
                  className="flex w-full flex-col gap-2 px-4 py-3 text-left hover:bg-background sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      <span className="font-mono text-xs text-text-secondary">{g.goal_code}</span>{' '}
                      {g.description}
                    </p>
                    <p className="text-xs text-text-secondary">Actor: {g.actor || '—'}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant={g.taxonomy_category === 'protection' ? 'primary' : 'warning'}>
                      {g.taxonomy_category}
                    </Badge>
                    <Badge variant="neutral">{g.granularity} goal</Badge>
                    <Badge variant={g.observable ? 'success' : 'neutral'}>
                      {g.observable ? 'observable' : 'unobservable'}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          )
        }
      </QueryState>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add goal" size="lg">
        <GoalForm
          documents={documentsQuery.data || []}
          onSubmit={(values) => createGoal.mutate(values)}
          submitting={createGoal.isPending}
          submitLabel="Add goal"
        />
      </Modal>
    </div>
  );
}
