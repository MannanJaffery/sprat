const { Router } = require('express');
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const controller = require('../controllers/userGroupsController');

const router = Router();

router.use(authenticate);

router.get('/', controller.list);
router.post(
  '/',
  authorize('admin', 'project_manager'),
  [body('name').trim().notEmpty().withMessage('Group name is required.')],
  validate,
  controller.create
);

// Any analyst/guest/PM can request to join a group; an admin or PM decides.
router.get('/join-requests', authorize('admin', 'project_manager'), controller.listJoinRequests);

router.post(
  '/:groupId/join-requests',
  [param('groupId').isInt(), body('message').optional().isString()],
  validate,
  controller.createJoinRequest
);

router.post(
  '/join-requests/:requestId/decide',
  authorize('admin', 'project_manager'),
  [param('requestId').isInt(), body('decision').isIn(['approved', 'rejected'])],
  validate,
  controller.decideJoinRequest
);

module.exports = router;
