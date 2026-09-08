const { Router } = require('express');
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');
const { authorize } = require('../middleware/auth');
const controller = require('../controllers/keywordDefinitionsController');

const router = Router({ mergeParams: true });

const editors = authorize('admin', 'project_manager', 'analyst');

// FR-GSM 14: everyone assigned to the project (guests included) can read definitions.
router.get('/', controller.list);

router.post(
  '/',
  editors,
  [
    body('keyword').trim().notEmpty().withMessage('A keyword is required.'),
    body('definition').trim().notEmpty().withMessage('A definition is required.'),
  ],
  validate,
  controller.create
);

router.patch(
  '/:defId',
  editors,
  [param('defId').isInt(), body('definition').trim().notEmpty()],
  validate,
  controller.update
);

// FR-GSM 15: lock / unlock a definition.
router.patch(
  '/:defId/lock',
  editors,
  [param('defId').isInt(), body('locked').isBoolean()],
  validate,
  controller.setLock
);

router.delete('/:defId', editors, param('defId').isInt(), validate, controller.remove);

module.exports = router;
