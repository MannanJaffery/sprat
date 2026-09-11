import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Ban, CheckCircle2, Users, UserCheck, X, Check } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import QueryState from '../../components/QueryState';
import EmptyState from '../../components/EmptyState';
import Badge, { roleVariant } from '../../components/Badge';
import Avatar from '../../components/Avatar';
import { SelectField } from '../../components/FormField';
import * as usersApi from '../../api/users';
import { getErrorMessage } from '../../api/client';

const ASSIGNABLE_ROLES = [
  { value: 'project_manager', label: 'Project Manager' },
  { value: 'analyst', label: 'Analyst' },
  { value: 'guest', label: 'Guest' },
];

const ROLE_LABELS = Object.fromEntries(ASSIGNABLE_ROLES.map((r) => [r.value, r.label]));

function PendingSignupRow({ signup }) {
  const queryClient = useQueryClient();
  const [role, setRole] = useState(signup.requested_role);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['users', 'pending'] });
    queryClient.invalidateQueries({ queryKey: ['users'] });
  };

  const approve = useMutation({
    mutationFn: () => usersApi.approveSignup(signup.id, role),
    onSuccess: () => {
      toast.success(`${signup.name || signup.email} approved as ${ROLE_LABELS[role]}.`);
      invalidate();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const reject = useMutation({
    mutationFn: () => usersApi.rejectSignup(signup.id),
    onSuccess: () => {
      toast.success('Signup rejected.');
      invalidate();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const busy = approve.isPending || reject.isPending;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface-soft p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <Avatar name={signup.name || signup.email} size="sm" />
        <div>
          <p className="text-sm font-medium text-text-primary">{signup.name || 'Unnamed'}</p>
          <p className="text-xs text-text-secondary">{signup.email}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <SelectField value={role} onChange={(e) => setRole(e.target.value)}>
          {ASSIGNABLE_ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </SelectField>
        <button className="btn-primary" disabled={busy} onClick={() => approve.mutate()}>
          <Check size={15} /> Approve
        </button>
        <button className="btn-secondary" disabled={busy} onClick={() => reject.mutate()}>
          <X size={15} /> Reject
        </button>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const queryClient = useQueryClient();

  const usersQuery = useQuery({ queryKey: ['users'], queryFn: usersApi.listUsers });
  const pendingQuery = useQuery({ queryKey: ['users', 'pending'], queryFn: usersApi.listPendingSignups });

  const toggleStatus = useMutation({
    mutationFn: ({ id, status }) =>
      status === 'active' ? usersApi.disableUser(id) : usersApi.enableUser(id),
    onSuccess: (_, vars) => {
      toast.success(vars.status === 'active' ? 'User disabled.' : 'User enabled.');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Users}
        eyebrow={`${usersQuery.data?.length ?? '…'} users`}
        title="Manage Users"
        description="Approve pending signups, assign roles, and disable accounts without losing their data."
      />

      <div className="card space-y-4">
        <h2 className="flex items-center gap-2 text-base font-semibold text-text-primary">
          <UserCheck size={16} className="text-text-secondary" /> Pending signups
        </h2>
        <QueryState query={pendingQuery}>
          {(pending) =>
            pending.length === 0 ? (
              <p className="text-sm text-text-secondary">No signups are waiting for approval.</p>
            ) : (
              <div className="space-y-2.5">
                {pending.map((signup) => (
                  <PendingSignupRow key={signup.id} signup={signup} />
                ))}
              </div>
            )
          }
        </QueryState>
      </div>

      <QueryState query={usersQuery}>
        {(users) =>
          users.length === 0 ? (
            <EmptyState icon={Users} title="No users yet" description="Approved accounts will appear here." />
          ) : (
            <div className="card overflow-x-auto p-0">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-background text-xs uppercase text-text-secondary">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Group</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-border transition-colors last:border-0 hover:bg-surface-soft/60">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5 font-medium text-text-primary">
                          <Avatar name={u.name} size="sm" />
                          {u.name}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-text-secondary">{u.email}</td>
                      <td className="px-4 py-3">
                        <Badge variant={roleVariant(u.role)}>{(u.role || '—').replace('_', ' ')}</Badge>
                      </td>
                      <td className="px-4 py-3 text-text-secondary">{u.user_group_name || '—'}</td>
                      <td className="px-4 py-3">
                        <Badge variant={u.status === 'active' ? 'success' : 'neutral'}>{u.status}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        {u.role !== 'admin' && (
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              title={u.status === 'active' ? 'Disable user' : 'Enable user'}
                              className="rounded-md p-1.5 text-text-secondary hover:bg-background hover:text-primary-600"
                              onClick={() => toggleStatus.mutate({ id: u.id, status: u.status })}
                            >
                              {u.status === 'active' ? <Ban size={16} /> : <CheckCircle2 size={16} />}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
      </QueryState>
    </div>
  );
}
