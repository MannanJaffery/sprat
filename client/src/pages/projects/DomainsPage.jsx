import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import QueryState from '../../components/QueryState';
import EmptyState from '../../components/EmptyState';
import ConfirmDialog from '../../components/ConfirmDialog';
import { TextField } from '../../components/FormField';
import { useAuth } from '../../hooks/useAuth';
import * as projectsApi from '../../api/projects';
import { getErrorMessage } from '../../api/client';

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
        title="Domains"
        description="Categorize policy documents (e.g. Healthcare, Financial, E-commerce)."
      />

      {canManage && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createDomain.mutate();
          }}
          className="card flex items-end gap-3"
        >
          <div className="flex-1">
            <TextField
              label="New domain name"
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-primary" disabled={createDomain.isPending}>
            <Plus size={16} /> Add domain
          </button>
        </form>
      )}

      <QueryState query={domainsQuery}>
        {(domains) =>
          domains.length === 0 ? (
            <EmptyState title="No domains yet" description="Add one above to start organizing documents." />
          ) : (
            <div className="card divide-y divide-border p-0">
              {domains.map((d) => (
                <div key={d.id} className="flex items-center justify-between px-4 py-3">
                  {editingId === d.id ? (
                    <input
                      className="input mr-3 max-w-xs"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      autoFocus
                    />
                  ) : (
                    <span className="text-sm font-medium text-text-primary">{d.name}</span>
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
                </div>
              ))}
            </div>
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
