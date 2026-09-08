const asyncHandler = require('../utils/asyncHandler');
const auditLogsService = require('../services/auditLogs');

// SR-1 / NFR4: filtered, paginated access log viewer.
const list = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const pageSize = Math.min(Number(req.query.pageSize) || 50, 200);
  res.json(
    auditLogsService.listAuditLogs({
      page,
      pageSize,
      action: req.query.action || undefined,
      objectType: req.query.objectType || undefined,
      userId: req.query.userId ? Number(req.query.userId) : undefined,
      from: req.query.from || undefined,
      to: req.query.to || undefined,
    })
  );
});

module.exports = { list };
