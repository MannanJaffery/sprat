import client from './client';

// FR8: attribute-based search across goals and scenarios in a project.
export const search = (projectId, params = {}) =>
  client.get(`/projects/${projectId}/search`, { params }).then((r) => r.data);
