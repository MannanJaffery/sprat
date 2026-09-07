import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, KeyRound, Ban, CheckCircle2 } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import QueryState from '../../components/QueryState';
import Modal from '../../components/Modal';
import Badge, { roleVariant } from '../../components/Badge';
import { TextField, SelectField } from '../../components/FormField';
import * as usersApi from '../../api/users';
import { getErrorMessage } from '../../api/client';

const ROLES = [
  { value: 'project_manager', label: 'Project Manager' },
  { value: 'analyst', label: 'Analyst' },
  { value: 'guest', label: 'Guest' },
  { value: 'admin', label: 'Administrator' },
];

function CreateUserModal({ open, onClose }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'analyst' });

  const mutation = useMutation({
    mutationFn: () => usersApi.createUser(form),
    onSuccess: () => {
      toast.success('User created.');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setForm({ name: '', email: '', password: '', role: 'analyst' });
      onClose();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  return (
    <Modal open={open} onClose={onClose} title="Create user">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
        className="space-y-4"
      >
        <TextField
          label="Full name"
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <TextField
          label="Email"
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <TextField
          label="Temporary password"
          type="password"
          minLength={8}
          required
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <SelectField
          label="Role"
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
        >
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </SelectField>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={mutation.isPending}>
            {mutation.isPending ? 'Creating…' : 'Create user'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ResetPasswordModal({ userId, onClose }) {
  const [password, setPassword] = useState('');
  const mutation = useMutation({
    mutationFn: () => usersApi.resetPassword(userId, password),
    onSuccess: () => {
      toast.success('Password reset.');
      onClose();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  return (
    <Modal open={Boolean(userId)} onClose={onClose} title="Reset password" size="sm">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
        className="space-y-4"
      >
        <TextField
          label="New password"
          type="password"
          minLength={8}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div className="flex justify-end gap-3">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving…' : 'Reset password'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [resetUserId, setResetUserId] = useState(null);

  const usersQuery = useQuery({ queryKey: ['users'], queryFn: usersApi.listUsers });

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
        title="Manage Users"
        description="Create Project Managers, Analysts, and Guests; reset passwords; disable accounts without losing their data."
        actions={
          <button className="btn-primary" onClick={() => setCreateOpen(true)}>
            <Plus size={16} /> New user
          </button>
        }
      />

      <QueryState query={usersQuery}>
        {(users) => (
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
                  <tr key={u.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium text-text-primary">{u.name}</td>
                    <td className="px-4 py-3 text-text-secondary">{u.email}</td>
                    <td className="px-4 py-3">
                      <Badge variant={roleVariant(u.role)}>{u.role.replace('_', ' ')}</Badge>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{u.user_group_name || '—'}</td>
                    <td className="px-4 py-3">
                      <Badge variant={u.status === 'active' ? 'success' : 'neutral'}>
                        {u.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          title="Reset password"
                          className="rounded-md p-1.5 text-text-secondary hover:bg-background hover:text-primary-600"
                          onClick={() => setResetUserId(u.id)}
                        >
                          <KeyRound size={16} />
                        </button>
                        <button
                          type="button"
                          title={u.status === 'active' ? 'Disable user' : 'Enable user'}
                          className="rounded-md p-1.5 text-text-secondary hover:bg-background hover:text-primary-600"
                          onClick={() => toggleStatus.mutate({ id: u.id, status: u.status })}
                        >
                          {u.status === 'active' ? <Ban size={16} /> : <CheckCircle2 size={16} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </QueryState>

      <CreateUserModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <ResetPasswordModal userId={resetUserId} onClose={() => setResetUserId(null)} />
    </div>
  );
}
