const { Router } = require('express');
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');
const { authorize } = require('../middleware/auth');
const { analysisLimiter } = require('../middleware/aiRateLimit');
const controller = require('../controllers/goalsController');
const classificationsController = require('../controllers/goalClassificationsController');
const aiController = require('../controllers/aiController');

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

// Rule-based grammar/conformance check (no AI) and a read-only cross-reference
// view — other goals related to this one by document, taxonomy, subject, or
// legislation. Any project member (including guests, domain-filtered) can view.
router.get('/:goalId/grammar-check', param('goalId').isInt(), validate, controller.grammarCheck);
router.get('/:goalId/cross-references', param('goalId').isInt(), validate, controller.crossReferences);

// AI-assisted analysis over every goal visible to the requester. Guests are
// excluded — this surfaces judgment calls, not plain read access — and both
// still respect guest domain filtering under the hood for non-guest reuse.
router.post(
  '/conflicts',
  authorize('admin', 'project_manager', 'analyst'),
  analysisLimiter,
  aiController.detectConflicts
);
router.post(
  '/summary',
  authorize('admin', 'project_manager', 'analyst'),
  analysisLimiter,
  aiController.generateSummary
);

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

// Values are validated against each dimension's allowed options in the service,
// since project-defined dimensions (FR9) are not known at route-declaration time.
router.post(
  '/:goalId/classifications',
  authorize('analyst'),
  [param('goalId').isInt()],
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
