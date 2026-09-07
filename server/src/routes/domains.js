const { Router } = require('express');
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');
const { authorize } = require('../middleware/auth');
const controller = require('../controllers/domainsController');

const router = Router({ mergeParams: true });

// FR-ADM 1/2/3: PM (or admin) manages domains within a project.
router.get('/', controller.list);

router.post(
  '/',
  authorize('admin', 'project_manager'),
  [body('name').trim().notEmpty().withMessage('Domain name is required.')],
  validate,
  controller.create
);

router.patch(
  '/:domainId',
  authorize('admin', 'project_manager'),
  [param('domainId').isInt(), body('name').trim().notEmpty()],
  validate,
  controller.update
);

router.delete(
  '/:domainId',
  authorize('admin', 'project_manager'),
  param('domainId').isInt(),
  validate,
  controller.remove
);

module.exports = router;
