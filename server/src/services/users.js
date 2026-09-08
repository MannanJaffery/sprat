const bcrypt = require('bcrypt');
const db = require('../../db/connection');
const { NotFoundError, ConflictError } = require('../utils/errors');

const SALT_ROUNDS = 12;

const PUBLIC_COLUMNS = `id, name, email, role, user_group_id, status, created_at, updated_at`;

function listUsers() {
  return db
    .prepare(
      `SELECT u.id, u.name, u.email, u.role, u.user_group_id, u.status, u.created_at, u.updated_at,
              g.name AS user_group_name
       FROM users u LEFT JOIN user_groups g ON g.id = u.user_group_id
       ORDER BY u.created_at DESC`
    )
    .all();
}

function getUserById(id) {
  const user = db.prepare(`SELECT ${PUBLIC_COLUMNS} FROM users WHERE id = ?`).get(id);
  if (!user) throw new NotFoundError('User not found');
  return user;
}

function findByEmailWithPassword(email) {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
}

// FR-UA 1b: admin creates project managers, analysts, and guests.
function createUser({ name, email, password, role, userGroupId }) {
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) throw new ConflictError('A user with this email already exists.');

  const hash = bcrypt.hashSync(password, SALT_ROUNDS); // NFR2: never store plaintext
  const info = db
    .prepare(
      `INSERT INTO users (name, email, password_hash, role, user_group_id)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(name, email, hash, role, userGroupId || null);

  return getUserById(info.lastInsertRowid);
}

function updateUser(id, { name, userGroupId }) {
  getUserById(id);
  db.prepare(
    `UPDATE users SET name = COALESCE(?, name), user_group_id = ?, updated_at = datetime('now')
     WHERE id = ?`
  ).run(name ?? null, userGroupId ?? null, id);
  return getUserById(id);
}

// FR-UA 1d: disabling removes access while preserving all data the user entered.
function setUserStatus(id, status) {
  getUserById(id);
  db.prepare(`UPDATE users SET status = ?, updated_at = datetime('now') WHERE id = ?`).run(
    status,
    id
  );
  return getUserById(id);
}

// FR-UA 2d: a project manager assigns an analyst (or guest) to a user group
// created by the administrator. Pass null to clear the assignment.
function setUserGroup(id, userGroupId) {
  const user = getUserById(id);
  if (!['analyst', 'guest'].includes(user.role)) {
    throw new ConflictError('Only analysts and guests can be assigned to a user group.');
  }
  if (userGroupId != null) {
    const group = db.prepare('SELECT id FROM user_groups WHERE id = ?').get(userGroupId);
    if (!group) throw new NotFoundError('User group not found');
  }
  db.prepare(`UPDATE users SET user_group_id = ?, updated_at = datetime('now') WHERE id = ?`).run(
    userGroupId ?? null,
    id
  );
  return getUserById(id);
}

// FR-UA 1c: admin can reset any user's password.
function resetPassword(id, newPassword) {
  getUserById(id);
  const hash = bcrypt.hashSync(newPassword, SALT_ROUNDS);
  db.prepare(`UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?`).run(
    hash,
    id
  );
}

module.exports = {
  listUsers,
  getUserById,
  findByEmailWithPassword,
  createUser,
  updateUser,
  setUserStatus,
  setUserGroup,
  resetPassword,
};
