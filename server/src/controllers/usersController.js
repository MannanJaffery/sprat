const asyncHandler = require('../utils/asyncHandler');
const usersService = require('../services/users');

const list = asyncHandler(async (req, res) => {
  res.json(await usersService.listUsers());
});

const getOne = asyncHandler(async (req, res) => {
  res.json(await usersService.getUserById(req.params.id));
});

const listPending = asyncHandler(async (req, res) => {
  res.json(await usersService.listPendingSignups());
});

// An admin approves a pending signup, assigning it a real (non-admin) role.
const approve = asyncHandler(async (req, res) => {
  const user = await usersService.approveSignup(req.params.id, req.body.role);
  res.locals.audit({ action: 'update', objectType: 'user', objectId: user.id, detail: 'approved' });
  res.json(user);
});

const reject = asyncHandler(async (req, res) => {
  await usersService.rejectSignup(req.params.id);
  res.locals.audit({ action: 'update', objectType: 'user', objectId: req.params.id, detail: 'rejected' });
  res.status(204).send();
});

const update = asyncHandler(async (req, res) => {
  const user = await usersService.updateUser(req.params.id, req.body);
  res.locals.audit({ action: 'update', objectType: 'user', objectId: user.id });
  res.json(user);
});

// Disable, preserving the user's historical data. Admins can never be disabled
// (enforced in the service layer).
const disable = asyncHandler(async (req, res) => {
  const user = await usersService.setUserStatus(req.params.id, 'disabled');
  res.locals.audit({ action: 'update', objectType: 'user', objectId: user.id });
  res.json(user);
});

const enable = asyncHandler(async (req, res) => {
  const user = await usersService.setUserStatus(req.params.id, 'active');
  res.locals.audit({ action: 'update', objectType: 'user', objectId: user.id });
  res.json(user);
});

// An admin or project manager assigns an analyst, guest, or fellow PM to a user group.
const setGroup = asyncHandler(async (req, res) => {
  const groupId = req.body.userGroupId === null ? null : Number(req.body.userGroupId);
  const user = await usersService.setUserGroup(req.params.id, groupId);
  res.locals.audit({ action: 'update', objectType: 'user', objectId: user.id, detail: 'user_group' });
  res.json(user);
});

module.exports = { list, getOne, listPending, approve, reject, update, disable, enable, setGroup };
