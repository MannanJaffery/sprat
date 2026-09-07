const asyncHandler = require('../utils/asyncHandler');
const auditLogsService = require('../services/auditLogs');

// SR-1: paginated access log viewer.
const list = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const pageSize = Math.min(Number(req.query.pageSize) || 50, 200);
  res.json(auditLogsService.listAuditLogs({ page, pageSize }));
});

module.exports = { list };
