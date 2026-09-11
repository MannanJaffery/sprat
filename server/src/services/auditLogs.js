const db = require('../../db/connection');

// Filtered, paginated view of the append-only access log for admins/PMs.
async function listAuditLogs({ page = 1, pageSize = 50, action, objectType, userId, from, to } = {}) {
  const offset = (page - 1) * pageSize;

  const clauses = [];
  const params = [];
  if (action) {
    params.push(action);
    clauses.push(`a.action = $${params.length}`);
  }
  if (objectType) {
    params.push(objectType);
    clauses.push(`a.object_type = $${params.length}`);
  }
  if (userId) {
    params.push(userId);
    clauses.push(`a.user_id = $${params.length}`);
  }
  if (from) {
    params.push(from);
    clauses.push(`a.occurred_at >= $${params.length}`);
  }
  if (to) {
    params.push(to);
    clauses.push(`a.occurred_at <= $${params.length}`);
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

  const listParams = [...params, pageSize, offset];
  const rows = await db.query(
    `SELECT a.id, a.action, a.object_type, a.object_id, a.occurred_at, a.ip_address, a.detail,
            u.name AS user_name, u.email AS user_email
     FROM access_logs a LEFT JOIN profiles u ON u.id = a.user_id
     ${where}
     ORDER BY a.occurred_at DESC, a.id DESC
     LIMIT $${listParams.length - 1} OFFSET $${listParams.length}`,
    listParams
  );

  const totalRow = await db.queryOne(`SELECT COUNT(*) AS count FROM access_logs a ${where}`, params);

  const objectTypeRows = await db.query('SELECT DISTINCT object_type FROM access_logs ORDER BY object_type');

  return {
    rows,
    total: Number(totalRow.count),
    page,
    pageSize,
    objectTypes: objectTypeRows.map((r) => r.object_type),
  };
}

module.exports = { listAuditLogs };
