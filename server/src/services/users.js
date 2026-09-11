const db = require('../../db/connection');
const { NotFoundError, ConflictError, ForbiddenError } = require('../utils/errors');

const PUBLIC_COLUMNS = 'id, name, email, role, user_group_id, status, created_at, updated_at';

// Only accounts an admin has actually approved (role assigned) — pending signups,
// whether or not they've submitted an onboarding request yet, have their own list
// (see listPendingSignups) and must never show up here with a null role.
async function listUsers() {
  return db.query(
    `SELECT u.id, u.name, u.email, u.role, u.user_group_id, u.status, u.created_at, u.updated_at,
            g.name AS user_group_name
     FROM profiles u LEFT JOIN user_groups g ON g.id = u.user_group_id
     WHERE u.role IS NOT NULL
     ORDER BY u.created_at DESC`
  );
}

async function getUserById(id) {
  const user = await db.queryOne(`SELECT ${PUBLIC_COLUMNS} FROM profiles WHERE id = $1`, [id]);
  if (!user) throw new NotFoundError('User not found');
  return user;
}

// Accounts that finished onboarding (submitted a requested role) and are awaiting
// an admin's decision.
async function listPendingSignups() {
  return db.query(
    `SELECT id, name, email, requested_role, created_at
     FROM profiles
     WHERE status = 'pending' AND requested_role IS NOT NULL
     ORDER BY created_at ASC`
  );
}

// Called once, right after Supabase Auth creates the account, with the name and
// intended role the user picked during onboarding. Never sets role directly —
// that only happens when an admin approves the request.
async function submitOnboarding(id, { name, requestedRole }) {
  const updated = await db.queryOne(
    `UPDATE profiles SET name = $1, requested_role = $2, updated_at = now()
     WHERE id = $3
     RETURNING ${PUBLIC_COLUMNS}`,
    [name, requestedRole, id]
  );
  if (!updated) throw new NotFoundError('Account not found');
  return updated;
}

// An admin approves a pending signup, assigning a real (never admin) role.
async function approveSignup(id, role) {
  if (role === 'admin') {
    throw new ForbiddenError('Admin accounts cannot be created through the app.');
  }
  const profile = await getUserById(id);
  if (profile.status !== 'pending') {
    throw new ConflictError('This account is not a pending signup.');
  }
  return db.queryOne(
    `UPDATE profiles SET role = $1, status = 'active', updated_at = now()
     WHERE id = $2
     RETURNING ${PUBLIC_COLUMNS}`,
    [role, id]
  );
}

async function rejectSignup(id) {
  const profile = await getUserById(id);
  if (profile.status !== 'pending') {
    throw new ConflictError('This account is not a pending signup.');
  }
  await db.query(`UPDATE profiles SET status = 'disabled', updated_at = now() WHERE id = $1`, [id]);
}

async function updateUser(id, { name, userGroupId }) {
  await getUserById(id);
  return db.queryOne(
    `UPDATE profiles SET name = COALESCE($1, name), user_group_id = $2, updated_at = now()
     WHERE id = $3
     RETURNING ${PUBLIC_COLUMNS}`,
    [name ?? null, userGroupId ?? null, id]
  );
}

// Disabling removes access while preserving all data the user entered. Admin
// accounts can never be disabled — through this function or any other path.
async function setUserStatus(id, status) {
  const user = await getUserById(id);
  if (status === 'disabled' && user.role === 'admin') {
    throw new ForbiddenError('Admin accounts cannot be disabled.');
  }
  return db.queryOne(
    `UPDATE profiles SET status = $1, updated_at = now() WHERE id = $2 RETURNING ${PUBLIC_COLUMNS}`,
    [status, id]
  );
}

// An admin or project manager assigns an analyst, guest, or fellow project
// manager to a user group. Pass null to clear the assignment.
async function setUserGroup(id, userGroupId) {
  const user = await getUserById(id);
  if (!['analyst', 'guest', 'project_manager'].includes(user.role)) {
    throw new ConflictError('Only analysts, guests, and project managers can be assigned to a user group.');
  }
  if (userGroupId != null) {
    const group = await db.queryOne('SELECT id FROM user_groups WHERE id = $1', [userGroupId]);
    if (!group) throw new NotFoundError('User group not found');
  }
  return db.queryOne(
    `UPDATE profiles SET user_group_id = $1, updated_at = now()
     WHERE id = $2
     RETURNING ${PUBLIC_COLUMNS}`,
    [userGroupId ?? null, id]
  );
}

module.exports = {
  listUsers,
  getUserById,
  listPendingSignups,
  submitOnboarding,
  approveSignup,
  rejectSignup,
  updateUser,
  setUserStatus,
  setUserGroup,
};
