import client from './client';

export const listUsers = () => client.get('/users').then((r) => r.data);

export const listPendingSignups = () => client.get('/users/pending').then((r) => r.data);

export const approveSignup = (id, role) =>
  client.post(`/users/${id}/approve`, { role }).then((r) => r.data);

export const rejectSignup = (id) => client.post(`/users/${id}/reject`).then((r) => r.data);

export const updateUser = (id, payload) => client.patch(`/users/${id}`, payload).then((r) => r.data);

export const disableUser = (id) => client.patch(`/users/${id}/disable`).then((r) => r.data);

export const enableUser = (id) => client.patch(`/users/${id}/enable`).then((r) => r.data);

// Assign an analyst/guest to an administrator-created user group.
export const setUserGroup = (id, userGroupId) =>
  client.patch(`/users/${id}/group`, { userGroupId }).then((r) => r.data);

export const listUserGroups = () => client.get('/user-groups').then((r) => r.data);

export const createUserGroup = (name) => client.post('/user-groups', { name }).then((r) => r.data);

// Any analyst/guest (not yet a member) can request to join a group; an admin/PM decides.
export const requestToJoinGroup = (groupId, message) =>
  client.post(`/user-groups/${groupId}/join-requests`, { message }).then((r) => r.data);

export const listGroupJoinRequests = () =>
  client.get('/user-groups/join-requests').then((r) => r.data);

export const decideGroupJoinRequest = (requestId, decision) =>
  client.post(`/user-groups/join-requests/${requestId}/decide`, { decision }).then((r) => r.data);
