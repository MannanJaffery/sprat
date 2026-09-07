import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, FileText, ArrowRight } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import QueryState from '../../components/QueryState';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import { TextField, TextAreaField, SelectField } from '../../components/FormField';
import { useAuth } from '../../hooks/useAuth';
import * as documentsApi from '../../api/documents';
import * as projectsApi from '../../api/projects';
import { getErrorMessage } from '../../api/client';

export default function DocumentsPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const canManage = user?.role === 'admin' || user?.role === 'project_manager';

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: '', content: '', domainId: '', sourceUrl: '' });

  const documentsQuery = useQuery({
    queryKey: ['documents', projectId],
    queryFn: () => documentsApi.listDocuments(projectId),
  });
  const domainsQuery = useQuery({
    queryKey: ['domains', projectId],
    queryFn: () => projectsApi.listDomains(projectId),
    enabled: createOpen,
  });

  const createDocument = useMutation({
    mutationFn: () =>
      documentsApi.createDocument(projectId, {
        ...form,
        domainId: form.domainId ? Number(form.domainId) : null,
      }),
    onSuccess: () => {
      toast.success('Document added to repository.');
      queryClient.invalidateQueries({ queryKey: ['documents', projectId] });
      setCreateOpen(false);
      setForm({ name: '', content: '', domainId: '', sourceUrl: '' });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documents"
        description="Privacy policies and other analysis documents in this project's repository."
        actions={
          canManage && (
            <button className="btn-primary" onClick={() => setCreateOpen(true)}>
              <Plus size={16} /> Add document
            </button>
          )
        }
      />

      <QueryState query={documentsQuery}>
        {(docs) =>
          docs.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No documents yet"
              description="Add a policy document to begin mining goals from it."
            />
          ) : (
            <div className="card divide-y divide-border p-0">
              {docs.map((d) => (
                <button
                  key={d.id}
                  onClick={() => navigate(`/projects/${projectId}/documents/${d.id}`)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-background"
                >
                  <div>
                    <p className="text-sm font-medium text-text-primary">{d.name}</p>
                    <p className="text-xs text-text-secondary">
                      {d.content ? `${d.content.split(/\s+/).length} words` : 'No content yet'}
                    </p>
                  </div>
                  <ArrowRight size={16} className="text-text-secondary" />
                </button>
              ))}
            </div>
          )
        }
      </QueryState>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add document" size="lg">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createDocument.mutate();
          }}
          className="space-y-4"
        >
          <TextField
            label="Document name"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <SelectField
            label="Domain"
            value={form.domainId}
            onChange={(e) => setForm({ ...form, domainId: e.target.value })}
          >
            <option value="">Unassigned</option>
            {(domainsQuery.data || []).map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </SelectField>
          <TextField
            label="Source URL (optional)"
            value={form.sourceUrl}
            onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })}
          />
          <TextAreaField
            label="Policy text"
            rows={8}
            required
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
          />
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setCreateOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={createDocument.isPending}>
              {createDocument.isPending ? 'Saving…' : 'Add document'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
