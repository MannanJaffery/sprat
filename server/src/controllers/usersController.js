const asyncHandler = require('../utils/asyncHandler');
const usersService = require('../services/users');

const list = asyncHandler(async (req, res) => {
  res.json(usersService.listUsers());
});

const getOne = asyncHandler(async (req, res) => {
  res.json(usersService.getUserById(req.params.id));
});

const create = asyncHandler(async (req, res) => {
  const user = usersService.createUser(req.body);
  res.locals.audit({ action: 'create', objectType: 'user', objectId: user.id });
  res.status(201).json(user);
});

const update = asyncHandler(async (req, res) => {
  const user = usersService.updateUser(req.params.id, req.body);
  res.locals.audit({ action: 'update', objectType: 'user', objectId: user.id });
  res.json(user);
});

// FR-UA 1d: disable, preserving the user's historical data.
const disable = asyncHandler(async (req, res) => {
  const user = usersService.setUserStatus(req.params.id, 'disabled');
  res.locals.audit({ action: 'update', objectType: 'user', objectId: user.id });
  res.json(user);
});

const enable = asyncHandler(async (req, res) => {
  const user = usersService.setUserStatus(req.params.id, 'active');
  res.locals.audit({ action: 'update', objectType: 'user', objectId: user.id });
  res.json(user);
});

// FR-UA 2d: a project manager (or admin) assigns an analyst/guest to a user group.
const setGroup = asyncHandler(async (req, res) => {
  const groupId = req.body.userGroupId === null ? null : Number(req.body.userGroupId);
  const user = usersService.setUserGroup(req.params.id, groupId);
  res.locals.audit({ action: 'update', objectType: 'user', objectId: user.id, detail: 'user_group' });
  res.json(user);
});

// FR-UA 1c: admin resets a user's password.
const resetPassword = asyncHandler(async (req, res) => {
  usersService.resetPassword(req.params.id, req.body.password);
  res.locals.audit({ action: 'update', objectType: 'user', objectId: Number(req.params.id) });
  res.status(204).send();
});

module.exports = { list, getOne, create, update, disable, enable, setGroup, resetPassword };
