import client from './client';

export const listProjects = () => client.get('/projects').then((r) => r.data);

export const getProject = (id) => client.get(`/projects/${id}`).then((r) => r.data);

export const createProject = (payload) => client.post('/projects', payload).then((r) => r.data);

export const listMembers = (projectId) =>
  client.get(`/projects/${projectId}/members`).then((r) => r.data);

export const addMember = (projectId, payload) =>
  client.post(`/projects/${projectId}/members`, payload).then((r) => r.data);

export const updateMemberRestrictions = (projectId, userId, guestRestrictions) =>
  client
    .patch(`/projects/${projectId}/members/${userId}`, { guestRestrictions })
    .then((r) => r.data);

// FR-UA 2e: assign / list / remove administrator-created user groups for a project.
export const listProjectUserGroups = (projectId) =>
  client.get(`/projects/${projectId}/user-groups`).then((r) => r.data);

export const assignUserGroup = (projectId, userGroupId) =>
  client.post(`/projects/${projectId}/user-groups`, { userGroupId }).then((r) => r.data);

export const removeUserGroup = (projectId, userGroupId) =>
  client.delete(`/projects/${projectId}/user-groups/${userGroupId}`).then((r) => r.data);

export const listDomains = (projectId) =>
  client.get(`/projects/${projectId}/domains`).then((r) => r.data);

export const createDomain = (projectId, name) =>
  client.post(`/projects/${projectId}/domains`, { name }).then((r) => r.data);

export const updateDomain = (projectId, domainId, name) =>
  client.patch(`/projects/${projectId}/domains/${domainId}`, { name }).then((r) => r.data);

export const deleteDomain = (projectId, domainId) =>
  client.delete(`/projects/${projectId}/domains/${domainId}`).then((r) => r.data);
