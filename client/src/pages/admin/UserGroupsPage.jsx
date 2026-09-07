import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import QueryState from '../../components/QueryState';
import EmptyState from '../../components/EmptyState';
import { TextField } from '../../components/FormField';
import * as usersApi from '../../api/users';
import { getErrorMessage } from '../../api/client';

export default function UserGroupsPage() {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const groupsQuery = useQuery({ queryKey: ['user-groups'], queryFn: usersApi.listUserGroups });

  const createGroup = useMutation({
    mutationFn: () => usersApi.createUserGroup(name),
    onSuccess: () => {
      toast.success('User group created.');
      setName('');
      queryClient.invalidateQueries({ queryKey: ['user-groups'] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Groups"
        description="Organizations analysts belong to (e.g. NCSU TPP.org, GT TPP.org)."
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          createGroup.mutate();
        }}
        className="card flex items-end gap-3"
      >
        <div className="flex-1">
          <TextField label="Group name" required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <button type="submit" className="btn-primary" disabled={createGroup.isPending}>
          <Plus size={16} /> Add group
        </button>
      </form>

      <QueryState query={groupsQuery}>
        {(groups) =>
          groups.length === 0 ? (
            <EmptyState title="No user groups yet" description="Create one above to get started." />
          ) : (
            <div className="card divide-y divide-border p-0">
              {groups.map((g) => (
                <div key={g.id} className="px-4 py-3 text-sm font-medium text-text-primary">
                  {g.name}
                </div>
              ))}
            </div>
          )
        }
      </QueryState>
    </div>
  );
}
