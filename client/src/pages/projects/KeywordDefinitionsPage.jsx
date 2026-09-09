import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Lock, LockOpen, Pencil, Trash2, BookMarked } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import QueryState from '../../components/QueryState';
import EmptyState from '../../components/EmptyState';
import Badge from '../../components/Badge';
import { TextField, TextAreaField } from '../../components/FormField';
import { useAuth } from '../../hooks/useAuth';
import * as keywordsApi from '../../api/keywordDefinitions';
import { getErrorMessage } from '../../api/client';

// FR11 (FR-GSM 14/15): keyword definitions; a locked one can only be edited or
// unlocked by the project manager or the analyst who created it.
export default function KeywordDefinitionsPage() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const canEdit = ['admin', 'project_manager', 'analyst'].includes(user?.role);
  const isManager = user?.role === 'admin' || user?.role === 'project_manager';

  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');

  const query = useQuery({
    queryKey: ['keyword-definitions', projectId],
    queryFn: () => keywordsApi.listDefinitions(projectId),
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['keyword-definitions', projectId] });

  const create = useMutation({
    mutationFn: (payload) => keywordsApi.createDefinition(projectId, payload),
    onSuccess: () => {
      toast.success('Keyword definition added.');
      invalidate();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const update = useMutation({
    mutationFn: ({ id, definition }) => keywordsApi.updateDefinition(projectId, id, definition),
    onSuccess: () => {
      toast.success('Definition updated.');
      setEditingId(null);
      invalidate();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const lock = useMutation({
    mutationFn: ({ id, locked }) => keywordsApi.setLock(projectId, id, locked),
    onSuccess: (_, v) => {
      toast.success(v.locked ? 'Definition locked.' : 'Definition unlocked.');
      invalidate();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const remove = useMutation({
    mutationFn: (id) => keywordsApi.deleteDefinition(projectId, id),
    onSuccess: () => {
      toast.success('Definition deleted.');
      invalidate();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const canModify = (d) => isManager || d.created_by === user?.id || !d.locked;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={BookMarked}
        eyebrow={`${query.data?.length ?? '…'} definitions`}
        title="Keyword Definitions"
        description="Shared definitions of goal keywords (FR-GSM 14). Lock a definition to protect it (FR-GSM 15)."
      />

      {canEdit && (
        <AddForm submitting={create.isPending} onSubmit={(payload) => create.mutate(payload)} />
      )}

      <QueryState query={query}>
        {(defs) =>
          defs.length === 0 ? (
            <EmptyState icon={BookMarked} title="No keyword definitions yet" />
          ) : (
            <div className="card divide-y divide-border p-0">
              {defs.map((d) => (
                <div key={d.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 text-sm font-semibold text-text-primary">
                        <span className="font-mono">{d.keyword}</span>
                        {d.locked && (
                          <Badge variant="warning">
                            <Lock size={11} className="mr-1" /> locked
                          </Badge>
                        )}
                      </p>
                      {editingId === d.id ? (
                        <div className="mt-2 space-y-2">
                          <TextAreaField
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                          />
                          <div className="flex gap-2">
                            <button
                              className="btn-primary"
                              disabled={update.isPending}
                              onClick={() => update.mutate({ id: d.id, definition: editText })}
                            >
                              Save
                            </button>
                            <button className="btn-secondary" onClick={() => setEditingId(null)}>
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="mt-1 text-sm text-text-secondary">{d.definition}</p>
                      )}
                      <p className="mt-1 text-xs text-text-secondary">
                        Created by {d.created_by_name}
                        {d.locked && d.locked_by_name ? ` · locked by ${d.locked_by_name}` : ''}
                      </p>
                    </div>

                    {canEdit && editingId !== d.id && (
                      <div className="flex shrink-0 gap-1">
                        <button
                          title={canModify(d) ? 'Edit' : 'Locked — no permission'}
                          disabled={!canModify(d)}
                          className="rounded-md p-1.5 text-text-secondary hover:bg-background hover:text-primary-600 disabled:opacity-40"
                          onClick={() => {
                            setEditingId(d.id);
                            setEditText(d.definition);
                          }}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          title={d.locked ? 'Unlock' : 'Lock'}
                          disabled={d.locked && !canModify(d)}
                          className="rounded-md p-1.5 text-text-secondary hover:bg-background hover:text-primary-600 disabled:opacity-40"
                          onClick={() => lock.mutate({ id: d.id, locked: !d.locked })}
                        >
                          {d.locked ? <LockOpen size={15} /> : <Lock size={15} />}
                        </button>
                        <button
                          title="Delete"
                          disabled={!canModify(d)}
                          className="rounded-md p-1.5 text-text-secondary hover:bg-background hover:text-danger disabled:opacity-40"
                          onClick={() => remove.mutate(d.id)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        }
      </QueryState>
    </div>
  );
}

function AddForm({ submitting, onSubmit }) {
  const [keyword, setKeyword] = useState('');
  const [definition, setDefinition] = useState('');
  return (
    <form
      className="card space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ keyword, definition });
        setKeyword('');
        setDefinition('');
      }}
    >
      <TextField
        label="Keyword"
        required
        placeholder="e.g. ALLOW"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
      />
      <TextAreaField
        label="Definition"
        required
        value={definition}
        onChange={(e) => setDefinition(e.target.value)}
      />
      <button type="submit" className="btn-primary" disabled={submitting}>
        <Plus size={16} /> Add definition
      </button>
    </form>
  );
}
