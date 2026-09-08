const db = require('../../db/connection');

const insertLog = db.prepare(
  `INSERT INTO access_logs (user_id, action, object_type, object_id, ip_address, detail)
   VALUES (?, ?, ?, ?, ?, ?)`
);

// SR-1 / NFR4: generate a tamper-evident access log entry for every add/edit/delete
// action. Controllers call res.locals.audit(...) after a successful mutation; the
// access_logs table is append-only (enforced by database triggers, see migration 002).
function auditLog(req, res, next) {
  res.locals.audit = ({ action, objectType, objectId, detail }) => {
    insertLog.run(
      req.user ? req.user.id : null,
      action,
      objectType,
      objectId ?? null,
      req.ip || null,
      detail ?? null
    );
  };
  next();
}

module.exports = auditLog;
