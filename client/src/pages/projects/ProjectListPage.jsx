import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, FolderKanban, ArrowRight } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import QueryState from '../../components/QueryState';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import { TextField, TextAreaField } from '../../components/FormField';
import { useAuth } from '../../hooks/useAuth';
import * as projectsApi from '../../api/projects';
import { getErrorMessage } from '../../api/client';

export default function ProjectListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });

  const projectsQuery = useQuery({ queryKey: ['projects'], queryFn: projectsApi.listProjects });

  const createProject = useMutation({
    mutationFn: () => projectsApi.createProject(form),
    onSuccess: (project) => {
      toast.success('Project created.');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setCreateOpen(false);
      setForm({ name: '', description: '' });
      navigate(`/projects/${project.id}/overview`);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const canCreate = user?.role === 'admin' || user?.role === 'project_manager';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description="A project groups the privacy policies, goals, and scenarios you are analyzing."
        actions={
          canCreate && (
            <button className="btn-primary" onClick={() => setCreateOpen(true)}>
              <Plus size={16} /> New project
            </button>
          )
        }
      />

      <QueryState query={projectsQuery}>
        {(projects) =>
          projects.length === 0 ? (
            <EmptyState
              icon={FolderKanban}
              title="No projects yet"
              description="Create a project to start collecting policies, goals, and scenarios."
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => navigate(`/projects/${p.id}/overview`)}
                  className="card flex flex-col items-start gap-2 text-left transition hover:border-primary-300 hover:shadow-md"
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="font-semibold text-text-primary">{p.name}</span>
                    <ArrowRight size={16} className="text-text-secondary" />
                  </div>
                  <p className="line-clamp-2 text-sm text-text-secondary">
                    {p.description || 'No description provided.'}
                  </p>
                </button>
              ))}
            </div>
          )
        }
      </QueryState>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New project">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createProject.mutate();
          }}
          className="space-y-4"
        >
          <TextField
            label="Project name"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <TextAreaField
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setCreateOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={createProject.isPending}>
              {createProject.isPending ? 'Creating…' : 'Create project'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
