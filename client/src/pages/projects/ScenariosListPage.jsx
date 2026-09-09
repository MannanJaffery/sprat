import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Plus, GitBranch, ChevronRight, Target } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import QueryState from '../../components/QueryState';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import Badge from '../../components/Badge';
import ScenarioForm from '../../components/ScenarioForm';
import { useAuth } from '../../hooks/useAuth';
import * as scenariosApi from '../../api/scenarios';
import { getErrorMessage } from '../../api/client';
import { staggerContainer, staggerItem } from '../../lib/motion';

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
        icon={GitBranch}
        eyebrow={`${scenariosQuery.data?.length ?? '…'} scenarios`}
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
            <motion.div initial="hidden" animate="show" variants={staggerContainer} className="space-y-2.5">
              {scenarios.map((s) => (
                <motion.button
                  key={s.id}
                  variants={staggerItem}
                  whileHover={{ x: 2 }}
                  onClick={() => navigate(`/projects/${projectId}/scenarios/${s.id}`)}
                  className="card card-hover flex w-full items-center justify-between text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                      <GitBranch size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">{s.name}</p>
                      <p className="flex items-center gap-1 text-xs text-text-secondary">
                        <Target size={11} /> {s.goals.length} linked goal(s)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={STATUS_VARIANT[s.status]}>{s.status}</Badge>
                    <ChevronRight size={16} className="text-text-muted" />
                  </div>
                </motion.button>
              ))}
            </motion.div>
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
