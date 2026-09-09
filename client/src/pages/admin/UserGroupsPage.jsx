import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Plus, FolderKanban } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import QueryState from '../../components/QueryState';
import EmptyState from '../../components/EmptyState';
import { TextField } from '../../components/FormField';
import * as usersApi from '../../api/users';
import { getErrorMessage } from '../../api/client';
import { staggerContainer, staggerItem } from '../../lib/motion';

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
        icon={FolderKanban}
        eyebrow={`${groupsQuery.data?.length ?? '…'} groups`}
        title="User Groups"
        description="Organizations analysts belong to (e.g. NCSU TPP.org, GT TPP.org). Assign a group to a project to bulk-add its members."
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
            <EmptyState
              icon={FolderKanban}
              title="No user groups yet"
              description="Create one above to get started."
            />
          ) : (
            <motion.div
              initial="hidden"
              animate="show"
              variants={staggerContainer}
              className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3"
            >
              {groups.map((g) => (
                <motion.div key={g.id} variants={staggerItem} className="card card-hover flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                    <FolderKanban size={16} />
                  </div>
                  <span className="text-sm font-medium text-text-primary">{g.name}</span>
                </motion.div>
              ))}
            </motion.div>
          )
        }
      </QueryState>
    </div>
  );
}
