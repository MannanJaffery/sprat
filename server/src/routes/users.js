const { Router } = require('express');
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const usersController = require('../controllers/usersController');

const router = Router();

router.use(authenticate);

// Read access is shared with Project Managers, who need the directory to assign
// analysts/guests to their projects. All mutations remain admin-only, and admin
// accounts are never created or disabled through this API at all.
router.get('/', authorize('admin', 'project_manager'), usersController.list);
router.get('/pending', authorize('admin'), usersController.listPending);
router.get(
  '/:id',
  authorize('admin', 'project_manager'),
  param('id').isUUID(),
  validate,
  usersController.getOne
);

router.post(
  '/:id/approve',
  authorize('admin'),
  [param('id').isUUID(), body('role').isIn(['project_manager', 'analyst', 'guest']).withMessage('Invalid role.')],
  validate,
  usersController.approve
);

router.post('/:id/reject', authorize('admin'), param('id').isUUID(), validate, usersController.reject);

router.patch(
  '/:id',
  authorize('admin'),
  [param('id').isUUID(), body('name').optional().trim().notEmpty()],
  validate,
  usersController.update
);

router.patch('/:id/disable', authorize('admin'), param('id').isUUID(), validate, usersController.disable);
router.patch('/:id/enable', authorize('admin'), param('id').isUUID(), validate, usersController.enable);

// Project managers assign analysts/guests to administrator-created user groups.
router.patch(
  '/:id/group',
  authorize('admin', 'project_manager'),
  [param('id').isUUID(), body('userGroupId').optional({ nullable: true }).isInt()],
  validate,
  usersController.setGroup
);

module.exports = router;
