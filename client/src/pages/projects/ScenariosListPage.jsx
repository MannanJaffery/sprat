import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, GitBranch } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import QueryState from '../../components/QueryState';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import Badge from '../../components/Badge';
import ScenarioForm from '../../components/ScenarioForm';
import { useAuth } from '../../hooks/useAuth';
import * as scenariosApi from '../../api/scenarios';
import { getErrorMessage } from '../../api/client';

const STATUS_VARIANT = { draft: 'neutral', active: 'primary', resolved: 'success' };

export default function ScenariosListPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const canManage = ['admin', 'project_manager', 'analyst'].includes(user?.role);

  const [createOpen, setCreateOpen] = useState(false);

  const scenariosQuery = useQuery({
    queryKey: ['scenarios', projectId],
    queryFn: () => scenariosApi.listScenarios(projectId),
  });

  const createScenario = useMutation({
    mutationFn: (payload) => scenariosApi.createScenario(projectId, payload),
    onSuccess: () => {
      toast.success('Scenario created.');
      queryClient.invalidateQueries({ queryKey: ['scenarios', projectId] });
      setCreateOpen(false);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Scenarios"
        description="Concrete usage situations that instantiate one or more goals."
        actions={
          canManage && (
            <button className="btn-primary" onClick={() => setCreateOpen(true)}>
              <Plus size={16} /> New scenario
            </button>
          )
        }
      />

      <QueryState query={scenariosQuery}>
        {(scenarios) =>
          scenarios.length === 0 ? (
            <EmptyState
              icon={GitBranch}
              title="No scenarios yet"
              description="Create a scenario and link it to the goals it instantiates."
            />
          ) : (
            <div className="card divide-y divide-border p-0">
              {scenarios.map((s) => (
                <button
                  key={s.id}
                  onClick={() => navigate(`/projects/${projectId}/scenarios/${s.id}`)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-background"
                >
                  <div>
                    <p className="text-sm font-medium text-text-primary">{s.name}</p>
                    <p className="text-xs text-text-secondary">{s.goals.length} linked goal(s)</p>
                  </div>
                  <Badge variant={STATUS_VARIANT[s.status]}>{s.status}</Badge>
                </button>
              ))}
            </div>
          )
        }
      </QueryState>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New scenario" size="lg">
        <ScenarioForm
          onSubmit={(values) => createScenario.mutate(values)}
          submitting={createScenario.isPending}
          submitLabel="Create scenario"
        />
      </Modal>
    </div>
  );
}
