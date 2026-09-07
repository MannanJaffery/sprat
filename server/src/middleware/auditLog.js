const db = require('../../db/connection');

const insertLog = db.prepare(
  'INSERT INTO access_logs (user_id, action, object_type, object_id) VALUES (?, ?, ?, ?)'
);

// SR-1: generate an access log entry for every add/edit/delete action.
// Controllers call this after a successful mutation via res.locals.audit(...).
function auditLog(req, res, next) {
  res.locals.audit = ({ action, objectType, objectId }) => {
    insertLog.run(req.user ? req.user.id : null, action, objectType, objectId ?? null);
  };
  next();
}

module.exports = auditLog;
