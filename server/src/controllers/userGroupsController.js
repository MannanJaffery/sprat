const asyncHandler = require('../utils/asyncHandler');
const userGroupsService = require('../services/userGroups');

const list = asyncHandler(async (req, res) => {
  res.json(userGroupsService.listUserGroups());
});

const create = asyncHandler(async (req, res) => {
  const group = userGroupsService.createUserGroup({ name: req.body.name, createdBy: req.user.id });
  res.locals.audit({ action: 'create', objectType: 'user_group', objectId: group.id });
  res.status(201).json(group);
});

module.exports = { list, create };
