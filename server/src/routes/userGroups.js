const { Router } = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const controller = require('../controllers/userGroupsController');

const router = Router();

router.use(authenticate);

router.get('/', controller.list);
router.post(
  '/',
  authorize('admin'),
  [body('name').trim().notEmpty().withMessage('Group name is required.')],
  validate,
  controller.create
);

module.exports = router;
