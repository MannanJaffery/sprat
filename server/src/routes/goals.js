const { Router } = require('express');
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');
const { authorize } = require('../middleware/auth');
const controller = require('../controllers/goalsController');
const classificationsController = require('../controllers/goalClassificationsController');
const { CLASSIFICATION_TYPES, VALUE_OPTIONS } = require('../services/goalClassifications');

const router = Router({ mergeParams: true });

const goalMutators = authorize('admin', 'project_manager', 'analyst');

const goalBodyRules = [
  body('documentId').isInt().withMessage('A source policy document is required.'),
  body('goalCode').trim().notEmpty().withMessage('Goal ID is required.'),
  body('description').trim().notEmpty().withMessage('Description is required.'),
  body('taxonomyCategory').isIn(['protection', 'vulnerability']),
  body('taxonomySubtype').trim().notEmpty().withMessage('Taxonomy subtype is required.'),
  body('granularity').isIn(['policy', 'scenario']),
  body('observable').isBoolean(),
  body('subjectClassifications').isArray({ min: 1 }).withMessage('Select at least one subject classification.'),
];

// FR-GSM 1/3/4/7/8: Manage Goals
router.get('/', controller.list);
router.get('/:goalId', param('goalId').isInt(), validate, controller.getOne);

router.post('/', goalMutators, goalBodyRules, validate, controller.create);

router.patch(
  '/:goalId',
  goalMutators,
  [
    param('goalId').isInt(),
    body('taxonomyCategory').optional().isIn(['protection', 'vulnerability']),
    body('granularity').optional().isIn(['policy', 'scenario']),
    body('subjectClassifications').optional().isArray({ min: 1 }),
  ],
  validate,
  controller.update
);

router.delete('/:goalId', goalMutators, param('goalId').isInt(), validate, controller.remove);

// FR-GSM 9
router.post(
  '/:goalId/replace',
  goalMutators,
  [param('goalId').isInt(), body('newGoalId').isInt()],
  validate,
  controller.replace
);

// FR-GSM 10 / FR6
router.get('/:goalId/traceability', param('goalId').isInt(), validate, controller.traceability);

router.post(
  '/:goalId/document-links',
  goalMutators,
  [param('goalId').isInt(), body('documentId').isInt()],
  validate,
  controller.linkDocument
);

// FR-ADM 7: multi-analyst classification comparison
router.get('/:goalId/classifications/options', classificationsController.options);

router.get(
  '/:goalId/classifications',
  param('goalId').isInt(),
  validate,
  classificationsController.list
);

router.post(
  '/:goalId/classifications',
  authorize('analyst'),
  [
    param('goalId').isInt(),
    ...CLASSIFICATION_TYPES.map((type) =>
      body(type).optional().isIn(VALUE_OPTIONS[type]).withMessage(`Invalid value for ${type}.`)
    ),
  ],
  validate,
  classificationsController.submit
);

router.get(
  '/:goalId/classifications/diff',
  authorize('admin', 'project_manager'),
  param('goalId').isInt(),
  validate,
  classificationsController.diff
);

module.exports = router;
