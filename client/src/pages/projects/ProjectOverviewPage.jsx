import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { UserPlus, Users, Trash2, LayoutDashboard, Check, X, UserCheck } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import QueryState from '../../components/QueryState';
import Modal from '../../components/Modal';
import Avatar from '../../components/Avatar';
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
        userId,
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
              {u.name} ({(u.role || 'no role').replace('_', ' ')})
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

// Any user can request to join this project; an admin or PM (who is already a
// member) approves or rejects the request here.
function JoinRequestsCard({ projectId }) {
  const queryClient = useQueryClient();
  const requestsQuery = useQuery({
    queryKey: ['project-join-requests', projectId],
    queryFn: () => projectsApi.listProjectJoinRequests(projectId),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['project-join-requests', projectId] });
    queryClient.invalidateQueries({ queryKey: ['members', projectId] });
    queryClient.invalidateQueries({ queryKey: ['projects'] });
  };

  const decide = useMutation({
    mutationFn: ({ requestId, decision }) =>
      projectsApi.decideProjectJoinRequest(projectId, requestId, decision),
    onSuccess: (_, vars) => {
      toast.success(vars.decision === 'approved' ? 'Request approved — member added.' : 'Request rejected.');
      invalidate();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  return (
    <div className="card space-y-4">
      <h2 className="flex items-center gap-2 text-base font-semibold text-text-primary">
        <UserCheck size={16} className="text-text-secondary" /> Pending join requests
      </h2>
      <QueryState query={requestsQuery}>
        {(requests) =>
          requests.length === 0 ? (
            <p className="text-sm text-text-secondary">No one is waiting to join this project.</p>
          ) : (
            <div className="space-y-2.5">
              {requests.map((r) => (
                <div
                  key={r.id}
                  className="flex flex-col gap-3 rounded-lg border border-border bg-surface-soft p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Avatar name={r.name || r.email} size="sm" />
                    <div>
                      <p className="text-sm font-medium text-text-primary">{r.name || 'Unnamed'}</p>
                      <p className="text-xs text-text-secondary">{r.email}</p>
                      {r.message && <p className="mt-1 text-xs italic text-text-secondary">“{r.message}”</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="btn-primary"
                      disabled={decide.isPending}
                      onClick={() => decide.mutate({ requestId: r.id, decision: 'approved' })}
                    >
                      <Check size={15} /> Approve
                    </button>
                    <button
                      className="btn-secondary"
                      disabled={decide.isPending}
                      onClick={() => decide.mutate({ requestId: r.id, decision: 'rejected' })}
                    >
                      <X size={15} /> Reject
                    </button>
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

// FR-UA 2e: assign an administrator-created user group to the project (bulk-adds its members).
function UserGroupsCard({ projectId, canManage }) {
  const queryClient = useQueryClient();
  const [groupId, setGroupId] = useState('');

  const assignedQuery = useQuery({
    queryKey: ['project-user-groups', projectId],
    queryFn: () => projectsApi.listProjectUserGroups(projectId),
  });
  const allGroupsQuery = useQuery({
    queryKey: ['user-groups'],
    queryFn: usersApi.listUserGroups,
    enabled: canManage,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['project-user-groups', projectId] });
    queryClient.invalidateQueries({ queryKey: ['members', projectId] });
  };

  const assign = useMutation({
    mutationFn: () => projectsApi.assignUserGroup(projectId, Number(groupId)),
    onSuccess: (res) => {
      toast.success(`Group assigned — ${res.membersAdded} member(s) added to the project.`);
      setGroupId('');
      invalidate();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const remove = useMutation({
    mutationFn: (id) => projectsApi.removeUserGroup(projectId, id),
    onSuccess: () => {
      toast.success('Group unassigned.');
      invalidate();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const assignedIds = (assignedQuery.data || []).map((g) => g.user_group_id);
  const options = (allGroupsQuery.data || []).filter((g) => !assignedIds.includes(g.id));

  return (
    <div className="card space-y-4">
      <div className="flex items-center gap-2">
        <Users size={16} className="text-text-secondary" />
        <h2 className="text-base font-semibold text-text-primary">User groups</h2>
      </div>

      {canManage && (
        <form
          className="flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (groupId) assign.mutate();
          }}
        >
          <div className="flex-1">
            <SelectField
              label="Assign a user group"
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
            >
              <option value="">Select a group…</option>
              {options.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </SelectField>
          </div>
          <button type="submit" className="btn-secondary" disabled={!groupId || assign.isPending}>
            Assign
          </button>
        </form>
      )}

      <QueryState query={assignedQuery}>
        {(groups) =>
          groups.length === 0 ? (
            <p className="text-sm text-text-secondary">No user groups assigned to this project.</p>
          ) : (
            <ul className="divide-y divide-border">
              {groups.map((g) => (
                <li key={g.user_group_id} className="flex items-center justify-between py-2 text-sm">
                  <span className="font-medium text-text-primary">
                    {g.name}{' '}
                    <span className="text-text-secondary">({g.member_count} member(s))</span>
                  </span>
                  {canManage && (
                    <button
                      className="rounded-md p-1.5 text-text-secondary hover:bg-background hover:text-danger"
                      title="Unassign group"
                      onClick={() => remove.mutate(g.user_group_id)}
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )
        }
      </QueryState>
    </div>
  );
}

// FR-UA 2d: PM assigns an individual analyst/guest to a user group.
function MemberGroupSelect({ member, groups }) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (value) =>
      usersApi.setUserGroup(member.user_id, value === '' ? null : Number(value)),
    onSuccess: () => {
      toast.success('User group updated.');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['members', member.project_id] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  return (
    <select
      className="input py-1 text-xs"
      defaultValue={member.user_group_id || ''}
      disabled={mutation.isPending}
      onChange={(e) => mutation.mutate(e.target.value)}
    >
      <option value="">No group</option>
      {groups.map((g) => (
        <option key={g.id} value={g.id}>
          {g.name}
        </option>
      ))}
    </select>
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

  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.listUsers,
    enabled: canManageMembers,
  });
  const groupsQuery = useQuery({
    queryKey: ['user-groups'],
    queryFn: usersApi.listUserGroups,
    enabled: canManageMembers,
  });

  const usersById = useMemo(
    () => Object.fromEntries((usersQuery.data || []).map((u) => [u.id, u])),
    [usersQuery.data]
  );
  const existingMemberIds = useMemo(
    () => (membersQuery.data || []).map((m) => m.user_id),
    [membersQuery.data]
  );

  return (
    <div className="space-y-6">
      <QueryState query={projectQuery}>
        {(project) => (
          <PageHeader
            icon={LayoutDashboard}
            eyebrow="Project overview"
            title={project.name}
            description={project.description || 'No description provided.'}
          />
        )}
      </QueryState>

      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-semibold text-text-primary">
            <Users size={16} className="text-text-secondary" /> Members
          </h2>
          {canManageMembers && (
            <button className="btn-secondary" onClick={() => setAddMemberOpen(true)}>
              <UserPlus size={16} /> Add member
            </button>
          )}
        </div>

        <QueryState query={membersQuery}>
          {(members) => (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border text-xs uppercase text-text-secondary">
                  <tr>
                    <th className="py-2">Name</th>
                    <th className="py-2">Email</th>
                    <th className="py-2">Role</th>
                    <th className="py-2">Access</th>
                    {canManageMembers && <th className="py-2">User group</th>}
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => {
                    const directoryUser = usersById[m.user_id];
                    const canAssignGroup =
                      canManageMembers && ['analyst', 'guest'].includes(m.role);
                    return (
                      <tr key={m.id} className="border-b border-border last:border-0">
                        <td className="py-2">
                          <div className="flex items-center gap-2.5 font-medium text-text-primary">
                            <Avatar name={m.name} size="sm" />
                            {m.name}
                          </div>
                        </td>
                        <td className="py-2 text-text-secondary">{m.email}</td>
                        <td className="py-2">
                          <Badge variant={roleVariant(m.role)}>{(m.role || 'no role').replace('_', ' ')}</Badge>
                        </td>
                        <td className="py-2 text-text-secondary">
                          {m.role !== 'guest'
                            ? 'Full project access'
                            : m.guest_restrictions
                            ? 'Restricted to assigned domains'
                            : 'Unrestricted'}
                        </td>
                        {canManageMembers && (
                          <td className="py-2">
                            {canAssignGroup ? (
                              <MemberGroupSelect
                                member={{
                                  ...m,
                                  project_id: projectId,
                                  user_group_id: directoryUser?.user_group_id || '',
                                }}
                                groups={groupsQuery.data || []}
                              />
                            ) : (
                              <span className="text-text-secondary">—</span>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </QueryState>
      </div>

      {canManageMembers && <JoinRequestsCard projectId={projectId} />}

      <UserGroupsCard projectId={projectId} canManage={canManageMembers} />

      <AddMemberModal
        open={addMemberOpen}
        onClose={() => setAddMemberOpen(false)}
        projectId={projectId}
        existingMemberIds={existingMemberIds}
      />
    </div>
  );
}
