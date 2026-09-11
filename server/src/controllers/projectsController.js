const asyncHandler = require('../utils/asyncHandler');
const projectsService = require('../services/projects');

const list = asyncHandler(async (req, res) => {
  res.json(await projectsService.listProjectsForUser(req.user.id));
});

const getOne = asyncHandler(async (req, res) => {
  res.json(await projectsService.getProjectById(req.params.projectId));
});

const create = asyncHandler(async (req, res) => {
  const project = await projectsService.createProject({
    name: req.body.name,
    description: req.body.description,
    createdBy: req.user.id,
  });
  res.locals.audit({ action: 'create', objectType: 'project', objectId: project.id });
  res.status(201).json(project);
});

const listMembers = asyncHandler(async (req, res) => {
  res.json(await projectsService.listMembers(req.params.projectId));
});

// Assign a user (and, for guests, their domain restrictions) to a project.
const addMember = asyncHandler(async (req, res) => {
  const memberId = await projectsService.addMember(req.params.projectId, {
    userId: req.body.userId,
    guestRestrictions: req.body.guestRestrictions,
  });
  res.locals.audit({ action: 'update', objectType: 'project_member', objectId: memberId });
  res.status(201).json({ id: memberId });
});

const updateMemberRestrictions = asyncHandler(async (req, res) => {
  await projectsService.updateMemberRestrictions(
    req.params.projectId,
    req.params.userId,
    req.body.guestRestrictions
  );
  res.locals.audit({ action: 'update', objectType: 'project_member', objectId: req.params.userId });
  res.status(204).send();
});

// PM assigns an administrator-created user group to the project.
const listUserGroups = asyncHandler(async (req, res) => {
  res.json(await projectsService.listProjectUserGroups(req.params.projectId));
});

const assignUserGroup = asyncHandler(async (req, res) => {
  const result = await projectsService.assignUserGroup(
    req.params.projectId,
    Number(req.body.userGroupId),
    req.user.id
  );
  res.locals.audit({
    action: 'update',
    objectType: 'project_user_group',
    objectId: Number(req.params.projectId),
    detail: `group ${result.userGroupId} (+${result.membersAdded} members)`,
  });
  res.status(201).json(result);
});

const removeUserGroup = asyncHandler(async (req, res) => {
  await projectsService.removeUserGroup(req.params.projectId, Number(req.params.userGroupId));
  res.locals.audit({
    action: 'update',
    objectType: 'project_user_group',
    objectId: Number(req.params.projectId),
    detail: `removed group ${req.params.userGroupId}`,
  });
  res.status(204).send();
});

// Any active user (not yet a member) requests to join.
const createJoinRequest = asyncHandler(async (req, res) => {
  const request = await projectsService.createJoinRequest(
    req.params.projectId,
    req.user.id,
    req.body.message
  );
  res.locals.audit({ action: 'create', objectType: 'project_join_request', objectId: request.id });
  res.status(201).json(request);
});

const listJoinRequests = asyncHandler(async (req, res) => {
  res.json(await projectsService.listJoinRequests(req.params.projectId));
});

const decideJoinRequest = asyncHandler(async (req, res) => {
  const result = await projectsService.decideJoinRequest(req.params.projectId, req.params.requestId, {
    decidedBy: req.user.id,
    decision: req.body.decision,
  });
  res.locals.audit({
    action: 'update',
    objectType: 'project_join_request',
    objectId: Number(req.params.requestId),
    detail: result.status,
  });
  res.json(result);
});

module.exports = {
  list,
  getOne,
  create,
  listMembers,
  addMember,
  updateMemberRestrictions,
  listUserGroups,
  assignUserGroup,
  removeUserGroup,
  createJoinRequest,
  listJoinRequests,
  decideJoinRequest,
};
