import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Plus, FolderKanban, Clock, RotateCcw, Check, X, UserPlus } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import QueryState from '../../components/QueryState';
import EmptyState from '../../components/EmptyState';
import Avatar from '../../components/Avatar';
import { TextField } from '../../components/FormField';
import { useAuth } from '../../hooks/useAuth';
import * as usersApi from '../../api/users';
import { getErrorMessage } from '../../api/client';
import { staggerContainer, staggerItem } from '../../lib/motion';

function GroupCard({ group, canJoin }) {
  const queryClient = useQueryClient();
  const requestJoin = useMutation({
    mutationFn: () => usersApi.requestToJoinGroup(group.id),
    onSuccess: () => {
      toast.success('Request sent — an admin or project manager will review it.');
      queryClient.invalidateQueries({ queryKey: ['user-groups'] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const creatorLabel = group.created_by_name || group.created_by_email || 'Unknown';

  return (
    <motion.div variants={staggerItem} className="card card-hover flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
            <FolderKanban size={18} />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary">{group.name}</p>
            <p className="text-xs text-text-secondary">
              {group.member_count} member{Number(group.member_count) === 1 ? '' : 's'}
            </p>
          </div>
        </div>

        {group.is_member ? (
          <span className="badge bg-success/10 text-success shrink-0">Member</span>
        ) : group.join_request_status === 'pending' ? (
          <span className="badge bg-warning/10 text-warning shrink-0">
            <Clock size={11} className="mr-1" /> Pending
          </span>
        ) : (
          canJoin && (
            <button
              type="button"
              className="btn-secondary !py-1 !px-2.5 text-xs shrink-0"
              disabled={requestJoin.isPending}
              onClick={() => requestJoin.mutate()}
            >
              {group.join_request_status === 'rejected' ? (
                <>
                  <RotateCcw size={12} /> Request again
                </>
              ) : (
                'Request to join'
              )}
            </button>
          )
        )}
      </div>

      <div className="flex items-center gap-2.5 border-t border-border pt-3">
        <Avatar name={creatorLabel} size="sm" />
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-text-primary">{creatorLabel}</p>
          <p className="text-[11px] uppercase tracking-wide text-text-secondary">Group creator</p>
        </div>
      </div>
    </motion.div>
  );
}

function JoinRequestRow({ request, currentUserId }) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['user-groups', 'join-requests'] });
    queryClient.invalidateQueries({ queryKey: ['user-groups'] });
  };
  const approve = useMutation({
    mutationFn: () => usersApi.decideGroupJoinRequest(request.id, 'approved'),
    onSuccess: () => {
      toast.success(`${request.name || request.email} added to ${request.group_name}.`);
      invalidate();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
  const reject = useMutation({
    mutationFn: () => usersApi.decideGroupJoinRequest(request.id, 'rejected'),
    onSuccess: () => {
      toast.success('Request rejected.');
      invalidate();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
  const busy = approve.isPending || reject.isPending;
  const isOwnRequest = request.user_id === currentUserId;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface-soft p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <Avatar name={request.name || request.email} size="sm" />
        <div>
          <p className="text-sm font-medium text-text-primary">
            {request.name || request.email} <span className="text-text-secondary">→ {request.group_name}</span>
          </p>
          <p className="text-xs text-text-secondary">{request.email}</p>
        </div>
      </div>
      {isOwnRequest ? (
        <p className="text-xs italic text-text-muted">You can't decide your own request.</p>
      ) : (
        <div className="flex items-center gap-2">
          <button className="btn-primary" disabled={busy} onClick={() => approve.mutate()}>
            <Check size={15} /> Approve
          </button>
          <button className="btn-secondary" disabled={busy} onClick={() => reject.mutate()}>
            <X size={15} /> Reject
          </button>
        </div>
      )}
    </div>
  );
}

export default function UserGroupsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');

  const canCreate = user?.role === 'admin' || user?.role === 'project_manager';
  const canDecide = user?.role === 'admin' || user?.role === 'project_manager';
  const canJoin = ['analyst', 'guest', 'project_manager'].includes(user?.role);

  const groupsQuery = useQuery({ queryKey: ['user-groups'], queryFn: usersApi.listUserGroups });
  const requestsQuery = useQuery({
    queryKey: ['user-groups', 'join-requests'],
    queryFn: usersApi.listGroupJoinRequests,
    enabled: canDecide,
  });

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
        description="Organizations analysts, guests, and project managers belong to. Assigning a group to a project bulk-adds its members."
      />

      {canCreate && (
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
      )}

      {canDecide && (
        <div className="card space-y-4">
          <h2 className="flex items-center gap-2 text-base font-semibold text-text-primary">
            <UserPlus size={16} className="text-text-secondary" /> Pending join requests
          </h2>
          <QueryState query={requestsQuery}>
            {(requests) =>
              requests.length === 0 ? (
                <p className="text-sm text-text-secondary">No group join requests are waiting for a decision.</p>
              ) : (
                <div className="space-y-2.5">
                  {requests.map((r) => (
                    <JoinRequestRow key={r.id} request={r} currentUserId={user?.id} />
                  ))}
                </div>
              )
            }
          </QueryState>
        </div>
      )}

      <QueryState query={groupsQuery}>
        {(groups) =>
          groups.length === 0 ? (
            <EmptyState
              icon={FolderKanban}
              title="No user groups yet"
              description={canCreate ? 'Create one above to get started.' : 'None have been created yet.'}
            />
          ) : (
            <motion.div
              initial="hidden"
              animate="show"
              variants={staggerContainer}
              className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3"
            >
              {groups.map((g) => (
                <GroupCard key={g.id} group={g} canJoin={canJoin} />
              ))}
            </motion.div>
          )
        }
      </QueryState>
    </div>
  );
}
