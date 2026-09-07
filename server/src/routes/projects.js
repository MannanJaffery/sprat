const { Router } = require('express');
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');
const { authorize } = require('../middleware/auth');
const { requireProjectMember } = require('../middleware/projectAccess');
const controller = require('../controllers/projectsController');

const domainsRouter = require('./domains');
const documentsRouter = require('./documents');
const goalsRouter = require('./goals');
const scenariosRouter = require('./scenarios');

const router = Router();

router.get('/', controller.list);

router.post(
  '/',
  authorize('admin', 'project_manager'),
  [body('name').trim().notEmpty().withMessage('Project name is required.')],
  validate,
  controller.create
);

router.get('/:projectId', param('projectId').isInt(), validate, requireProjectMember(), controller.getOne);

// FR-UA 2e/2f: project membership + guest restrictions.
router.get('/:projectId/members', requireProjectMember(), controller.listMembers);

router.post(
  '/:projectId/members',
  requireProjectMember(),
  authorize('admin', 'project_manager'),
  [body('userId').isInt()],
  validate,
  controller.addMember
);

router.patch(
  '/:projectId/members/:userId',
  requireProjectMember(),
  authorize('admin', 'project_manager'),
  [param('userId').isInt()],
  validate,
  controller.updateMemberRestrictions
);

router.use('/:projectId/domains', requireProjectMember(), domainsRouter);
router.use('/:projectId/documents', requireProjectMember(), documentsRouter);
router.use('/:projectId/goals', requireProjectMember(), goalsRouter);
router.use('/:projectId/scenarios', requireProjectMember(), scenariosRouter);

module.exports = router;
