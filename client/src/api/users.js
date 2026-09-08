import client from './client';

export const listUsers = () => client.get('/users').then((r) => r.data);

export const createUser = (payload) => client.post('/users', payload).then((r) => r.data);

export const updateUser = (id, payload) => client.patch(`/users/${id}`, payload).then((r) => r.data);

export const disableUser = (id) => client.patch(`/users/${id}/disable`).then((r) => r.data);

export const enableUser = (id) => client.patch(`/users/${id}/enable`).then((r) => r.data);

export const resetPassword = (id, password) =>
  client.post(`/users/${id}/reset-password`, { password }).then((r) => r.data);

// FR-UA 2d: assign an analyst/guest to an administrator-created user group.
export const setUserGroup = (id, userGroupId) =>
  client.patch(`/users/${id}/group`, { userGroupId }).then((r) => r.data);

export const listUserGroups = () => client.get('/user-groups').then((r) => r.data);

export const createUserGroup = (name) => client.post('/user-groups', { name }).then((r) => r.data);
