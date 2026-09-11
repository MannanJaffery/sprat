import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Plus, FolderKanban, ArrowRight, Crown, Sparkles, Users, Clock, RotateCcw } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import QueryState from '../../components/QueryState';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import StatTile from '../../components/StatTile';
import { TextField, TextAreaField } from '../../components/FormField';
import { useAuth } from '../../hooks/useAuth';
import * as projectsApi from '../../api/projects';
import { getErrorMessage } from '../../api/client';
import { fadeInUp, staggerContainer, staggerItem } from '../../lib/motion';
import { ProjectsTrendChart, MembershipBreakdownChart } from '../../components/DashboardCharts';

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function ProjectCard({ project, canEnter, onEnter }) {
  const queryClient = useQueryClient();
  const requestJoin = useMutation({
    mutationFn: () => projectsApi.requestToJoinProject(project.id),
    onSuccess: () => {
      toast.success('Request sent — a project manager or admin will review it.');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  return (
    <motion.div variants={staggerItem} whileHover={{ y: -3 }} className="card card-hover flex flex-col gap-3 text-left">
      <div className="flex w-full items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary-100 to-primary-200 text-primary-700">
          <FolderKanban size={18} />
        </div>
        {canEnter && <ArrowRight size={16} className="text-text-muted" />}
      </div>
      <button
        type="button"
        onClick={canEnter ? onEnter : undefined}
        disabled={!canEnter}
        className={`text-left ${canEnter ? '' : 'cursor-default'}`}
      >
        <p className="font-semibold text-text-primary">{project.name}</p>
        <p className="mt-1 line-clamp-2 text-sm text-text-secondary">
          {project.description || 'No description provided.'}
        </p>
      </button>

      <div className="mt-1 flex items-center justify-between">
        <span className="flex items-center gap-1 text-xs text-text-muted">
          <Users size={12} /> {project.member_count} member{Number(project.member_count) === 1 ? '' : 's'}
        </span>

        {canEnter ? (
          <span className="badge bg-success/10 text-success">Member</span>
        ) : project.join_request_status === 'pending' ? (
          <span className="badge bg-warning/10 text-warning">
            <Clock size={11} className="mr-1" /> Pending
          </span>
        ) : (
          <button
            type="button"
            className="btn-secondary !py-1 !px-2.5 text-xs"
            disabled={requestJoin.isPending}
            onClick={() => requestJoin.mutate()}
          >
            {project.join_request_status === 'rejected' ? (
              <>
                <RotateCcw size={12} /> Request again
              </>
            ) : (
              'Request to join'
            )}
          </button>
        )}
      </div>
    </motion.div>
  );
}

export default function ProjectListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });

  const projectsQuery = useQuery({ queryKey: ['projects'], queryFn: projectsApi.listProjects });

  const stats = useMemo(() => {
    const projects = projectsQuery.data || [];
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return {
      total: projects.length,
      owned: projects.filter((p) => p.created_by === user?.id).length,
      recent: projects.filter((p) => new Date(`${p.created_at}Z`).getTime() >= weekAgo).length,
    };
  }, [projectsQuery.data, user?.id]);

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
    <div className="space-y-8">
      <motion.div initial="hidden" animate="show" variants={fadeInUp}>
        <p className="flex items-center gap-1.5 text-sm font-medium text-primary-600">
          <Sparkles size={14} /> {greeting()}, {user?.name?.split(' ')[0]}
        </p>
        <h1 className="mt-1 font-display text-3xl font-medium text-text-primary">Your workspace</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Browse every project below — join one you're already part of, or request to join another.
        </p>
      </motion.div>

      <motion.div
        initial="hidden"
        animate="show"
        variants={staggerContainer}
        className="grid grid-cols-1 gap-4 sm:grid-cols-3"
      >
        <motion.div variants={staggerItem}>
          <StatTile icon={FolderKanban} label="Total projects" value={stats.total} />
        </motion.div>
        <motion.div variants={staggerItem}>
          <StatTile icon={Crown} label="Owned by you" value={stats.owned} />
        </motion.div>
        <motion.div variants={staggerItem}>
          <StatTile icon={Sparkles} label="Added this week" value={stats.recent} />
        </motion.div>
      </motion.div>

      {projectsQuery.data?.length > 0 && (
        <motion.div
          initial="hidden"
          animate="show"
          variants={staggerContainer}
          className={`grid grid-cols-1 gap-4 ${user?.role === 'guest' ? '' : 'lg:grid-cols-5'}`}
        >
          {user?.role !== 'guest' && (
            <motion.div variants={staggerItem} className="card lg:col-span-3">
              <p className="text-sm font-semibold text-text-primary">Projects created, by week</p>
              <p className="mt-0.5 text-xs text-text-muted">Last 8 weeks</p>
              <div className="mt-3">
                <ProjectsTrendChart projects={projectsQuery.data} />
              </div>
            </motion.div>
          )}
          <motion.div variants={staggerItem} className={user?.role === 'guest' ? 'card' : 'card lg:col-span-2'}>
            <p className="text-sm font-semibold text-text-primary">Your membership status</p>
            <p className="mt-0.5 text-xs text-text-muted">Across every project you can see</p>
            <div className="mt-6">
              <MembershipBreakdownChart projects={projectsQuery.data} />
            </div>
          </motion.div>
        </motion.div>
      )}

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
            <motion.div
              initial="hidden"
              animate="show"
              variants={staggerContainer}
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              {projects.map((p) => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  canEnter={p.is_member || user?.role === 'admin'}
                  onEnter={() => navigate(`/projects/${p.id}/overview`)}
                />
              ))}
            </motion.div>
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
