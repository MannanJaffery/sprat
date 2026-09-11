const db = require('../../db/connection');

// Generates a tamper-evident access log entry for every add/edit/delete action.
// Controllers call res.locals.audit(...) after a successful mutation; the
// access_logs table is append-only (enforced by database triggers). Writes are
// fire-and-forget from the controller's point of view (matching the previous
// synchronous behaviour) but failures are still logged rather than silently lost.
function auditLog(req, res, next) {
  res.locals.audit = ({ action, objectType, objectId, detail }) => {
    db.query(
      `INSERT INTO access_logs (user_id, action, object_type, object_id, ip_address, detail)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        req.user ? req.user.id : null,
        action,
        objectType,
        objectId != null ? String(objectId) : null,
        req.ip || null,
        detail ?? null,
      ]
    ).catch((err) => console.error('Failed to write audit log entry:', err));
  };
  next();
}

module.exports = auditLog;
