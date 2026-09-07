import client from './client';

export const listAuditLogs = (page = 1, pageSize = 50) =>
  client.get('/audit-logs', { params: { page, pageSize } }).then((r) => r.data);
