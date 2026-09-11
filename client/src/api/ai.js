import client from './client';

export const sendChatMessage = (history, projectId) =>
  client.post('/ai/chat', { history, projectId: projectId ? Number(projectId) : undefined }).then((r) => r.data);

export const detectGoalConflicts = (projectId) =>
  client.post(`/projects/${projectId}/goals/conflicts`).then((r) => r.data);

export const generateGoalsSummary = (projectId) =>
  client.post(`/projects/${projectId}/goals/summary`).then((r) => r.data);
