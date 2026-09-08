const { Router } = require('express');
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');
const { authorize } = require('../middleware/auth');
const controller = require('../controllers/classificationTypesController');

const router = Router({ mergeParams: true });

const optionsRule = body('options')
  .isArray({ min: 2 })
  .withMessage('Provide at least two options.');

// FR-GSM 5: dynamically added goal classification dimensions.
router.get('/types', controller.listTypes);
router.post(
  '/types',
  authorize('admin', 'project_manager'),
  [body('label').trim().notEmpty().withMessage('A label is required.'), optionsRule],
  validate,
  controller.createType
);

// FR-GSM 6: analyst-raised requests for a new dimension, decided by a PM.
router.get('/requests', controller.listRequests);
router.post(
  '/requests',
  authorize('admin', 'project_manager', 'analyst'),
  [body('label').trim().notEmpty().withMessage('A label is required.'), optionsRule],
  validate,
  controller.createRequest
);
router.patch(
  '/requests/:requestId',
  authorize('admin', 'project_manager'),
  [
    param('requestId').isInt(),
    body('decision').isIn(['approved', 'rejected']).withMessage('Decision must be approved or rejected.'),
  ],
  validate,
  controller.decideRequest
);

module.exports = router;
