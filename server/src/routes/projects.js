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
const searchRouter = require('./search');
const classificationTypesRouter = require('./classificationTypes');
const keywordDefinitionsRouter = require('./keywordDefinitions');

const router = Router();

router.get('/', controller.list);

router.post(
  '/',
  authorize('admin', 'project_manager'),
  [body('name').trim().notEmpty().withMessage('Project name is required.')],
  validate,
  controller.create
);

// Any active user can view basic project info (name/description/member count) to
// decide whether to request joining it — this does NOT require membership.
// Every route below that touches real project data still requires it.
router.get('/:projectId', param('projectId').isInt(), validate, controller.getOne);

router.post(
  '/:projectId/join-requests',
  [param('projectId').isInt(), body('message').optional().isString()],
  validate,
  controller.createJoinRequest
);

router.get(
  '/:projectId/join-requests',
  requireProjectMember(),
  authorize('admin', 'project_manager'),
  controller.listJoinRequests
);

router.post(
  '/:projectId/join-requests/:requestId/decide',
  requireProjectMember(),
  authorize('admin', 'project_manager'),
  [param('requestId').isInt(), body('decision').isIn(['approved', 'rejected'])],
  validate,
  controller.decideJoinRequest
);

// FR-UA 2e/2f: project membership + guest restrictions.
router.get('/:projectId/members', requireProjectMember(), controller.listMembers);

router.post(
  '/:projectId/members',
  requireProjectMember(),
  authorize('admin', 'project_manager'),
  [body('userId').isUUID()],
  validate,
  controller.addMember
);

router.patch(
  '/:projectId/members/:userId',
  requireProjectMember(),
  authorize('admin', 'project_manager'),
  [param('userId').isUUID()],
  validate,
  controller.updateMemberRestrictions
);

// FR-UA 2e: assign an administrator-created user group to the project.
router.get('/:projectId/user-groups', requireProjectMember(), controller.listUserGroups);
router.post(
  '/:projectId/user-groups',
  requireProjectMember(),
  authorize('admin', 'project_manager'),
  [body('userGroupId').isInt()],
  validate,
  controller.assignUserGroup
);
router.delete(
  '/:projectId/user-groups/:userGroupId',
  requireProjectMember(),
  authorize('admin', 'project_manager'),
  [param('userGroupId').isInt()],
  validate,
  controller.removeUserGroup
);

router.use('/:projectId/domains', requireProjectMember(), domainsRouter);
router.use('/:projectId/documents', requireProjectMember(), documentsRouter);
router.use('/:projectId/goals', requireProjectMember(), goalsRouter);
router.use('/:projectId/scenarios', requireProjectMember(), scenariosRouter);
router.use('/:projectId/search', requireProjectMember(), searchRouter);
router.use('/:projectId/classifications', requireProjectMember(), classificationTypesRouter);
router.use('/:projectId/keyword-definitions', requireProjectMember(), keywordDefinitionsRouter);

module.exports = router;
