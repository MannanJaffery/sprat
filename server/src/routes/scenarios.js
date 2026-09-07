const { Router } = require('express');
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');
const { authorize } = require('../middleware/auth');
const controller = require('../controllers/scenariosController');

const router = Router({ mergeParams: true });

const scenarioMutators = authorize('admin', 'project_manager', 'analyst');

// FR-SSM 1/2/3/6: Manage Scenarios
router.get('/', controller.list);
router.get('/:scenarioId', param('scenarioId').isInt(), validate, controller.getOne);

router.post(
  '/',
  scenarioMutators,
  [body('name').trim().notEmpty().withMessage('Scenario name is required.')],
  validate,
  controller.create
);

router.patch(
  '/:scenarioId',
  scenarioMutators,
  param('scenarioId').isInt(),
  validate,
  controller.update
);

router.delete(
  '/:scenarioId',
  scenarioMutators,
  param('scenarioId').isInt(),
  validate,
  controller.remove
);

// FR-SSM 4: reuse an existing goal in this scenario
router.post(
  '/:scenarioId/goals',
  scenarioMutators,
  [param('scenarioId').isInt(), body('goalId').isInt()],
  validate,
  controller.linkGoal
);

router.delete(
  '/:scenarioId/goals/:goalId',
  scenarioMutators,
  [param('scenarioId').isInt(), param('goalId').isInt()],
  validate,
  controller.unlinkGoal
);

module.exports = router;
