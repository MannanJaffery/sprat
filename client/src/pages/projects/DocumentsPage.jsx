import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Plus, FileText, ChevronRight } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import QueryState from '../../components/QueryState';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import { TextField, TextAreaField, SelectField } from '../../components/FormField';
import { useAuth } from '../../hooks/useAuth';
import * as documentsApi from '../../api/documents';
import * as projectsApi from '../../api/projects';
import { getErrorMessage } from '../../api/client';
import { staggerContainer, staggerItem } from '../../lib/motion';

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
        icon={FileText}
        eyebrow={`${documentsQuery.data?.length ?? '…'} documents`}
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
            <motion.div initial="hidden" animate="show" variants={staggerContainer} className="space-y-2.5">
              {docs.map((d) => (
                <motion.button
                  key={d.id}
                  variants={staggerItem}
                  whileHover={{ x: 2 }}
                  onClick={() => navigate(`/projects/${projectId}/documents/${d.id}`)}
                  className="card card-hover flex w-full items-center justify-between text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                      <FileText size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">{d.name}</p>
                      <p className="text-xs text-text-secondary">
                        {d.content ? `${d.content.split(/\s+/).length} words` : 'No content yet'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-text-muted" />
                </motion.button>
              ))}
            </motion.div>
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
