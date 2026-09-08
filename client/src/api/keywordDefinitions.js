import client from './client';

// FR11 (FR-GSM 14/15): goal keyword definitions with lock/unlock.
export const listDefinitions = (projectId) =>
  client.get(`/projects/${projectId}/keyword-definitions`).then((r) => r.data);

export const createDefinition = (projectId, payload) =>
  client.post(`/projects/${projectId}/keyword-definitions`, payload).then((r) => r.data);

export const updateDefinition = (projectId, defId, definition) =>
  client
    .patch(`/projects/${projectId}/keyword-definitions/${defId}`, { definition })
    .then((r) => r.data);

export const setLock = (projectId, defId, locked) =>
  client
    .patch(`/projects/${projectId}/keyword-definitions/${defId}/lock`, { locked })
    .then((r) => r.data);

export const deleteDefinition = (projectId, defId) =>
  client.delete(`/projects/${projectId}/keyword-definitions/${defId}`).then((r) => r.data);
