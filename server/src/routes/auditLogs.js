const { Router } = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const controller = require('../controllers/auditLogsController');

const router = Router();

// SR-1: admins and project managers can review the access log.
router.get('/', authenticate, authorize('admin', 'project_manager'), controller.list);

module.exports = router;
