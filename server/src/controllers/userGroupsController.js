const asyncHandler = require('../utils/asyncHandler');
const userGroupsService = require('../services/userGroups');

const list = asyncHandler(async (req, res) => {
  res.json(await userGroupsService.listUserGroups(req.user.id));
});

const create = asyncHandler(async (req, res) => {
  const group = await userGroupsService.createUserGroup({
    name: req.body.name,
    createdBy: req.user.id,
    creatorRole: req.user.role,
  });
  res.locals.audit({ action: 'create', objectType: 'user_group', objectId: group.id });
  res.status(201).json(group);
});

const createJoinRequest = asyncHandler(async (req, res) => {
  const request = await userGroupsService.createJoinRequest(
    Number(req.params.groupId),
    req.user.id,
    req.user.role,
    req.body.message
  );
  res.locals.audit({ action: 'create', objectType: 'user_group_join_request', objectId: request.id });
  res.status(201).json(request);
});

const listJoinRequests = asyncHandler(async (req, res) => {
  res.json(await userGroupsService.listJoinRequests(req.user));
});

const decideJoinRequest = asyncHandler(async (req, res) => {
  const result = await userGroupsService.decideJoinRequest(req.params.requestId, {
    decidedBy: req.user.id,
    decidedByRole: req.user.role,
    decision: req.body.decision,
  });
  res.locals.audit({
    action: 'update',
    objectType: 'user_group_join_request',
    objectId: Number(req.params.requestId),
    detail: result.status,
  });
  res.json(result);
});

module.exports = { list, create, createJoinRequest, listJoinRequests, decideJoinRequest };
