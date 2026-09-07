const db = require('../../db/connection');
const { ConflictError } = require('../utils/errors');

function listUserGroups() {
  return db.prepare('SELECT * FROM user_groups ORDER BY name').all();
}

function createUserGroup({ name, createdBy }) {
  const existing = db.prepare('SELECT id FROM user_groups WHERE name = ?').get(name);
  if (existing) throw new ConflictError('A user group with this name already exists.');
  const info = db
    .prepare('INSERT INTO user_groups (name, created_by) VALUES (?, ?)')
    .run(name, createdBy);
  return db.prepare('SELECT * FROM user_groups WHERE id = ?').get(info.lastInsertRowid);
}

module.exports = { listUserGroups, createUserGroup };
