import client from './client';

export const listScenarios = (projectId) =>
  client.get(`/projects/${projectId}/scenarios`).then((r) => r.data);

export const getScenario = (projectId, scenarioId) =>
  client.get(`/projects/${projectId}/scenarios/${scenarioId}`).then((r) => r.data);

export const createScenario = (projectId, payload) =>
  client.post(`/projects/${projectId}/scenarios`, payload).then((r) => r.data);

export const updateScenario = (projectId, scenarioId, payload) =>
  client.patch(`/projects/${projectId}/scenarios/${scenarioId}`, payload).then((r) => r.data);

export const deleteScenario = (projectId, scenarioId) =>
  client.delete(`/projects/${projectId}/scenarios/${scenarioId}`).then((r) => r.data);

export const linkGoal = (projectId, scenarioId, goalId) =>
  client.post(`/projects/${projectId}/scenarios/${scenarioId}/goals`, { goalId }).then((r) => r.data);

export const unlinkGoal = (projectId, scenarioId, goalId) =>
  client.delete(`/projects/${projectId}/scenarios/${scenarioId}/goals/${goalId}`).then((r) => r.data);
