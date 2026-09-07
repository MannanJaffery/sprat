import client from './client';

export const listDocuments = (projectId, domainId) =>
  client
    .get(`/projects/${projectId}/documents`, { params: domainId ? { domainId } : {} })
    .then((r) => r.data);

export const getDocument = (projectId, documentId) =>
  client.get(`/projects/${projectId}/documents/${documentId}`).then((r) => r.data);

export const createDocument = (projectId, payload) =>
  client.post(`/projects/${projectId}/documents`, payload).then((r) => r.data);

export const updateDocument = (projectId, documentId, payload) =>
  client.patch(`/projects/${projectId}/documents/${documentId}`, payload).then((r) => r.data);

export const deleteDocument = (projectId, documentId) =>
  client.delete(`/projects/${projectId}/documents/${documentId}`).then((r) => r.data);

export const getReadability = (projectId, documentId) =>
  client.get(`/projects/${projectId}/documents/${documentId}/readability`).then((r) => r.data);

export const getGoalOccurrences = (projectId, documentId) =>
  client
    .get(`/projects/${projectId}/documents/${documentId}/goal-occurrences`)
    .then((r) => r.data);

export const getDistinctGoalCount = (projectId, documentId) =>
  client
    .get(`/projects/${projectId}/documents/${documentId}/distinct-goal-count`)
    .then((r) => r.data);
