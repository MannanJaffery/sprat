import client from './client';

export const listGoals = (projectId, filters = {}) =>
  client.get(`/projects/${projectId}/goals`, { params: filters }).then((r) => r.data);

export const getGoal = (projectId, goalId) =>
  client.get(`/projects/${projectId}/goals/${goalId}`).then((r) => r.data);

export const createGoal = (projectId, payload) =>
  client.post(`/projects/${projectId}/goals`, payload).then((r) => r.data);

export const updateGoal = (projectId, goalId, payload) =>
  client.patch(`/projects/${projectId}/goals/${goalId}`, payload).then((r) => r.data);

export const deleteGoal = (projectId, goalId) =>
  client.delete(`/projects/${projectId}/goals/${goalId}`).then((r) => r.data);

export const replaceGoal = (projectId, goalId, newGoalId) =>
  client.post(`/projects/${projectId}/goals/${goalId}/replace`, { newGoalId }).then((r) => r.data);

export const getTraceability = (projectId, goalId) =>
  client.get(`/projects/${projectId}/goals/${goalId}/traceability`).then((r) => r.data);

export const linkGoalToDocument = (projectId, goalId, documentId) =>
  client
    .post(`/projects/${projectId}/goals/${goalId}/document-links`, { documentId })
    .then((r) => r.data);

export const getClassificationOptions = (projectId, goalId) =>
  client.get(`/projects/${projectId}/goals/${goalId}/classifications/options`).then((r) => r.data);

export const getClassifications = (projectId, goalId) =>
  client.get(`/projects/${projectId}/goals/${goalId}/classifications`).then((r) => r.data);

export const submitClassifications = (projectId, goalId, values) =>
  client.post(`/projects/${projectId}/goals/${goalId}/classifications`, values).then((r) => r.data);

export const getClassificationDiff = (projectId, goalId) =>
  client.get(`/projects/${projectId}/goals/${goalId}/classifications/diff`).then((r) => r.data);

export const getGrammarCheck = (projectId, goalId) =>
  client.get(`/projects/${projectId}/goals/${goalId}/grammar-check`).then((r) => r.data);

export const getCrossReferences = (projectId, goalId) =>
  client.get(`/projects/${projectId}/goals/${goalId}/cross-references`).then((r) => r.data);
