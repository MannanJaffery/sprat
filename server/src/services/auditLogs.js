const db = require('../../db/connection');

// SR-1 / NFR4: filtered, paginated view of the append-only access log for admins/PMs.
function listAuditLogs({ page = 1, pageSize = 50, action, objectType, userId, from, to } = {}) {
  const offset = (page - 1) * pageSize;

  const clauses = [];
  const params = [];
  if (action) {
    clauses.push('a.action = ?');
    params.push(action);
  }
  if (objectType) {
    clauses.push('a.object_type = ?');
    params.push(objectType);
  }
  if (userId) {
    clauses.push('a.user_id = ?');
    params.push(userId);
  }
  if (from) {
    clauses.push('a.occurred_at >= ?');
    params.push(from);
  }
  if (to) {
    clauses.push('a.occurred_at <= ?');
    params.push(to);
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

  const rows = db
    .prepare(
      `SELECT a.id, a.action, a.object_type, a.object_id, a.occurred_at, a.ip_address, a.detail,
              u.name AS user_name, u.email AS user_email
       FROM access_logs a LEFT JOIN users u ON u.id = a.user_id
       ${where}
       ORDER BY a.occurred_at DESC, a.id DESC
       LIMIT ? OFFSET ?`
    )
    .all(...params, pageSize, offset);

  const total = db
    .prepare(`SELECT COUNT(*) AS count FROM access_logs a ${where}`)
    .get(...params).count;

  const objectTypes = db
    .prepare('SELECT DISTINCT object_type FROM access_logs ORDER BY object_type')
    .all()
    .map((r) => r.object_type);

  return { rows, total, page, pageSize, objectTypes };
}

module.exports = { listAuditLogs };
