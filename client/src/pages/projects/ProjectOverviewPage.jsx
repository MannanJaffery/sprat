import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { UserPlus } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import QueryState from '../../components/QueryState';
import Modal from '../../components/Modal';
import Badge, { roleVariant } from '../../components/Badge';
import { SelectField, CheckboxField } from '../../components/FormField';
import { useAuth } from '../../hooks/useAuth';
import * as projectsApi from '../../api/projects';
import * as usersApi from '../../api/users';
import { getErrorMessage } from '../../api/client';

function AddMemberModal({ open, onClose, projectId, existingMemberIds }) {
  const queryClient = useQueryClient();
  const usersQuery = useQuery({ queryKey: ['users'], queryFn: usersApi.listUsers, enabled: open });
  const domainsQuery = useQuery({
    queryKey: ['domains', projectId],
    queryFn: () => projectsApi.listDomains(projectId),
    enabled: open,
  });

  const [userId, setUserId] = useState('');
  const [restrictToAll, setRestrictToAll] = useState(true);
  const [allowedDomainIds, setAllowedDomainIds] = useState([]);

  const availableUsers = (usersQuery.data || []).filter((u) => !existingMemberIds.includes(u.id));
  const selectedUser = availableUsers.find((u) => String(u.id) === userId);
  const isGuest = selectedUser?.role === 'guest';

  const mutation = useMutation({
    mutationFn: () =>
      projectsApi.addMember(projectId, {
        userId: Number(userId),
        guestRestrictions: isGuest && !restrictToAll ? allowedDomainIds : null,
      }),
    onSuccess: () => {
      toast.success('Member added to project.');
      queryClient.invalidateQueries({ queryKey: ['members', projectId] });
      onClose();
      setUserId('');
      setRestrictToAll(true);
      setAllowedDomainIds([]);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  return (
    <Modal open={open} onClose={onClose} title="Add project member">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
        className="space-y-4"
      >
        <SelectField label="User" required value={userId} onChange={(e) => setUserId(e.target.value)}>
          <option value="">Select a user…</option>
          {availableUsers.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} ({u.role.replace('_', ' ')})
            </option>
          ))}
        </SelectField>

        {isGuest && (
          <div className="space-y-2 rounded-lg border border-border bg-background p-3">
            <CheckboxField
              label="Unrestricted access to all domains in this project"
              checked={restrictToAll}
              onChange={(e) => setRestrictToAll(e.target.checked)}
            />
            {!restrictToAll && (
              <div className="space-y-1 pl-6">
                {(domainsQuery.data || []).map((d) => (
                  <label key={d.id} className="flex items-center gap-2 text-sm text-text-primary">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-border text-primary-600"
                      checked={allowedDomainIds.includes(d.id)}
                      onChange={(e) =>
                        setAllowedDomainIds((prev) =>
                          e.target.checked ? [...prev, d.id] : prev.filter((id) => id !== d.id)
                        )
                      }
                    />
                    {d.name}
                  </label>
                ))}
                {(domainsQuery.data || []).length === 0 && (
                  <p className="text-xs text-text-secondary">No domains created yet.</p>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={mutation.isPending || !userId}>
            {mutation.isPending ? 'Adding…' : 'Add member'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function ProjectOverviewPage() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const [addMemberOpen, setAddMemberOpen] = useState(false);

  const projectQuery = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectsApi.getProject(projectId),
  });
  const membersQuery = useQuery({
    queryKey: ['members', projectId],
    queryFn: () => projectsApi.listMembers(projectId),
  });

  const canManageMembers = user?.role === 'admin' || user?.role === 'project_manager';
  const existingMemberIds = useMemo(
    () => (membersQuery.data || []).map((m) => m.user_id),
    [membersQuery.data]
  );

  return (
    <div className="space-y-6">
      <QueryState query={projectQuery}>
        {(project) => (
          <PageHeader
            title={project.name}
            description={project.description || 'No description provided.'}
          />
        )}
      </QueryState>

      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-text-primary">Members</h2>
          {canManageMembers && (
            <button className="btn-secondary" onClick={() => setAddMemberOpen(true)}>
              <UserPlus size={16} /> Add member
            </button>
          )}
        </div>

        <QueryState query={membersQuery}>
          {(members) => (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase text-text-secondary">
                <tr>
                  <th className="py-2">Name</th>
                  <th className="py-2">Email</th>
                  <th className="py-2">Role</th>
                  <th className="py-2">Access</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id} className="border-b border-border last:border-0">
                    <td className="py-2 font-medium text-text-primary">{m.name}</td>
                    <td className="py-2 text-text-secondary">{m.email}</td>
                    <td className="py-2">
                      <Badge variant={roleVariant(m.role)}>{m.role.replace('_', ' ')}</Badge>
                    </td>
                    <td className="py-2 text-text-secondary">
                      {m.role !== 'guest'
                        ? 'Full project access'
                        : m.guest_restrictions
                        ? 'Restricted to assigned domains'
                        : 'Unrestricted'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </QueryState>
      </div>

      <AddMemberModal
        open={addMemberOpen}
        onClose={() => setAddMemberOpen(false)}
        projectId={projectId}
        existingMemberIds={existingMemberIds}
      />
    </div>
  );
}
