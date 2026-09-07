const { Router } = require('express');
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');
const { authorize } = require('../middleware/auth');
const controller = require('../controllers/documentsController');
const readabilityController = require('../controllers/readabilityController');
const goalsController = require('../controllers/goalsController');

const router = Router({ mergeParams: true });

// FR-ADM 1/2/3/4/5: PM manages the policy document repository; everyone assigned can browse it.
router.get('/', controller.list);
router.get('/:documentId', param('documentId').isInt(), validate, controller.getOne);

router.post(
  '/',
  authorize('admin', 'project_manager'),
  [
    body('name').trim().notEmpty().withMessage('Document name is required.'),
    body('content').optional().isString(),
    body('domainId').optional({ nullable: true }).isInt(),
  ],
  validate,
  controller.create
);

router.patch(
  '/:documentId',
  authorize('admin', 'project_manager'),
  param('documentId').isInt(),
  validate,
  controller.update
);

router.delete(
  '/:documentId',
  authorize('admin', 'project_manager'),
  param('documentId').isInt(),
  validate,
  controller.remove
);

// FR-FRE 1
router.get('/:documentId/readability', param('documentId').isInt(), validate, readabilityController.getReadability);

// FR-GSM 11/12
router.get(
  '/:documentId/goal-occurrences',
  param('documentId').isInt(),
  validate,
  goalsController.documentOccurrences
);
router.get(
  '/:documentId/distinct-goal-count',
  param('documentId').isInt(),
  validate,
  goalsController.documentDistinctGoalCount
);

module.exports = router;
