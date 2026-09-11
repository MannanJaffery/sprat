import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Tags } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import QueryState from '../../components/QueryState';
import EmptyState from '../../components/EmptyState';
import ConfirmDialog from '../../components/ConfirmDialog';
import { TextField } from '../../components/FormField';
import { useAuth } from '../../hooks/useAuth';
import * as projectsApi from '../../api/projects';
import { getErrorMessage } from '../../api/client';
import { staggerContainer, staggerItem } from '../../lib/motion';
import { DOMAIN_PRESETS } from '../../constants/domains';

export default function DomainsPage() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const canManage = user?.role === 'admin' || user?.role === 'project_manager';

  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const domainsQuery = useQuery({
    queryKey: ['domains', projectId],
    queryFn: () => projectsApi.listDomains(projectId),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['domains', projectId] });

  const createDomain = useMutation({
    mutationFn: () => projectsApi.createDomain(projectId, newName),
    onSuccess: () => {
      toast.success('Domain created.');
      setNewName('');
      invalidate();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const updateDomain = useMutation({
    mutationFn: () => projectsApi.updateDomain(projectId, editingId, editingName),
    onSuccess: () => {
      toast.success('Domain updated.');
      setEditingId(null);
      invalidate();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const deleteDomain = useMutation({
    mutationFn: () => projectsApi.deleteDomain(projectId, deletingId),
    onSuccess: () => {
      toast.success('Domain deleted.');
      setDeletingId(null);
      invalidate();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Tags}
        eyebrow={`${domainsQuery.data?.length ?? '…'} domains`}
        title="Domains"
        description="Categorize policy documents (e.g. Healthcare, Financial, E-commerce)."
      />

      {canManage && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createDomain.mutate();
          }}
          className="card space-y-3"
        >
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <TextField
                label="New domain name"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Healthcare, or type your own"
              />
            </div>
            <button type="submit" className="btn-primary" disabled={createDomain.isPending}>
              <Plus size={16} /> Add domain
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {DOMAIN_PRESETS.filter(
              (preset) => !(domainsQuery.data || []).some((d) => d.name.toLowerCase() === preset.toLowerCase())
            ).map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setNewName(preset)}
                className="rounded-full border border-border bg-surface-soft px-3 py-1 text-xs text-text-secondary transition-colors hover:border-primary-300 hover:text-primary-700"
              >
                {preset}
              </button>
            ))}
          </div>
        </form>
      )}

      <QueryState query={domainsQuery}>
        {(domains) =>
          domains.length === 0 ? (
            <EmptyState title="No domains yet" description="Add one above to start organizing documents." />
          ) : (
            <motion.div initial="hidden" animate="show" variants={staggerContainer} className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {domains.map((d) => (
                <motion.div key={d.id} variants={staggerItem} className="card card-hover flex items-center justify-between">
                  {editingId === d.id ? (
                    <input
                      className="input mr-3 max-w-xs"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      autoFocus
                    />
                  ) : (
                    <span className="flex items-center gap-2.5 text-sm font-medium text-text-primary">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                        <Tags size={14} />
                      </span>
                      {d.name}
                    </span>
                  )}
                  {canManage && (
                    <div className="flex gap-2">
                      {editingId === d.id ? (
                        <>
                          <button className="btn-secondary" onClick={() => setEditingId(null)}>
                            Cancel
                          </button>
                          <button
                            className="btn-primary"
                            onClick={() => updateDomain.mutate()}
                            disabled={updateDomain.isPending}
                          >
                            Save
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="rounded-md p-1.5 text-text-secondary hover:bg-background hover:text-primary-600"
                            onClick={() => {
                              setEditingId(d.id);
                              setEditingName(d.name);
                            }}
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            className="rounded-md p-1.5 text-text-secondary hover:bg-background hover:text-danger"
                            onClick={() => setDeletingId(d.id)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </motion.div>
              ))}
            </motion.div>
          )
        }
      </QueryState>

      <ConfirmDialog
        open={Boolean(deletingId)}
        title="Delete domain"
        message="Documents in this domain will become uncategorized. This cannot be undone."
        danger
        confirmLabel="Delete"
        onCancel={() => setDeletingId(null)}
        onConfirm={() => deleteDomain.mutate()}
        loading={deleteDomain.isPending}
      />
    </div>
  );
}
