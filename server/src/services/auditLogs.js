const db = require('../../db/connection');

// SR-1: paginated view of the access log for admins/PMs.
function listAuditLogs({ page = 1, pageSize = 50 } = {}) {
  const offset = (page - 1) * pageSize;
  const rows = db
    .prepare(
      `SELECT a.id, a.action, a.object_type, a.object_id, a.occurred_at,
              u.name AS user_name, u.email AS user_email
       FROM access_logs a LEFT JOIN users u ON u.id = a.user_id
       ORDER BY a.occurred_at DESC
       LIMIT ? OFFSET ?`
    )
    .all(pageSize, offset);

  const total = db.prepare('SELECT COUNT(*) AS count FROM access_logs').get().count;

  return { rows, total, page, pageSize };
}

module.exports = { listAuditLogs };
