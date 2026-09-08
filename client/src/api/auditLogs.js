import client from './client';

// SR-1 / NFR4: filtered, paginated access log.
export const listAuditLogs = (params = {}) =>
  client.get('/audit-logs', { params }).then((r) => r.data);
