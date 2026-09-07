const { Router } = require('express');
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const usersController = require('../controllers/usersController');

const router = Router();

router.use(authenticate);

// Read access is shared with Project Managers, who need the directory to assign
// analysts/guests to their projects (FR-UA 2e). All mutations remain admin-only (FR-UA 1).
router.get('/', authorize('admin', 'project_manager'), usersController.list);
router.get(
  '/:id',
  authorize('admin', 'project_manager'),
  param('id').isInt(),
  validate,
  usersController.getOne
);

router.post(
  '/',
  authorize('admin'),
  [
    body('name').trim().notEmpty().withMessage('Name is required.'),
    body('email').isEmail().withMessage('A valid email is required.'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters.'),
    body('role').isIn(['admin', 'project_manager', 'analyst', 'guest']).withMessage('Invalid role.'),
  ],
  validate,
  usersController.create
);

router.patch(
  '/:id',
  authorize('admin'),
  [param('id').isInt(), body('name').optional().trim().notEmpty()],
  validate,
  usersController.update
);

router.patch('/:id/disable', authorize('admin'), param('id').isInt(), validate, usersController.disable);
router.patch('/:id/enable', authorize('admin'), param('id').isInt(), validate, usersController.enable);

router.post(
  '/:id/reset-password',
  authorize('admin'),
  [param('id').isInt(), body('password').isLength({ min: 8 })],
  validate,
  usersController.resetPassword
);

module.exports = router;
