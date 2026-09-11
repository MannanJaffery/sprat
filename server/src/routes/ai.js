const { Router } = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const { chatLimiter } = require('../middleware/aiRateLimit');
const controller = require('../controllers/aiController');

const router = Router();

router.use(authenticate);

// Global assistant — any active user (every real role has one) can ask it
// about SPRAT's workflow. A pending signup has no role yet, so it's excluded
// implicitly by listing every real role rather than gating on "logged in".
router.post(
  '/chat',
  authorize('admin', 'project_manager', 'analyst', 'guest'),
  chatLimiter,
  [
    body('history').isArray({ min: 1, max: 16 }),
    body('projectId').optional().isInt(),
  ],
  validate,
  controller.chat
);

module.exports = router;
