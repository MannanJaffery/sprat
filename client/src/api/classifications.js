import client from './client';

// FR9 (FR-GSM 5/6): project-defined goal classification dimensions + analyst requests.
export const listTypes = (projectId) =>
  client.get(`/projects/${projectId}/classifications/types`).then((r) => r.data);

export const createType = (projectId, payload) =>
  client.post(`/projects/${projectId}/classifications/types`, payload).then((r) => r.data);

export const listRequests = (projectId) =>
  client.get(`/projects/${projectId}/classifications/requests`).then((r) => r.data);

export const createRequest = (projectId, payload) =>
  client.post(`/projects/${projectId}/classifications/requests`, payload).then((r) => r.data);

export const decideRequest = (projectId, requestId, decision) =>
  client
    .patch(`/projects/${projectId}/classifications/requests/${requestId}`, { decision })
    .then((r) => r.data);
