const db = require('../../db/connection');
const { NotFoundError, ConflictError, ForbiddenError, ApiError } = require('../utils/errors');

function decorate(row) {
  return { ...row, locked: Boolean(row.locked) };
}

// FR-GSM 14: analysts create/update goal keyword definitions; guests view them.
function listDefinitions(projectId) {
  return db
    .prepare(
      `SELECT k.*, c.name AS created_by_name, l.name AS locked_by_name
       FROM keyword_definitions k
       JOIN users c ON c.id = k.created_by
       LEFT JOIN users l ON l.id = k.locked_by
       WHERE k.project_id = ?
       ORDER BY k.keyword`
    )
    .all(projectId)
    .map(decorate);
}

function getById(id) {
  const row = db.prepare('SELECT * FROM keyword_definitions WHERE id = ?').get(id);
  if (!row) throw new NotFoundError('Keyword definition not found');
  return row;
}

// FR-GSM 15: a locked definition may only be changed or unlocked by the project
// manager or the analyst who first created it.
function assertCanModify(row, user) {
  if (!row.locked) return;
  const isManager = user.role === 'admin' || user.role === 'project_manager';
  const isCreator = row.created_by === user.id;
  if (!isManager && !isCreator) {
    throw new ForbiddenError(
      'This keyword definition is locked. Only the project manager or its original author can change it.'
    );
  }
}

function createDefinition(projectId, { keyword, definition, createdBy }) {
  const cleanKeyword = String(keyword || '').trim();
  const cleanDefinition = String(definition || '').trim();
  if (!cleanKeyword || !cleanDefinition) {
    throw new ApiError(400, 'A keyword and its definition are both required.');
  }
  const existing = db
    .prepare('SELECT id FROM keyword_definitions WHERE project_id = ? AND keyword = ? COLLATE NOCASE')
    .get(projectId, cleanKeyword);
  if (existing) throw new ConflictError('A definition for this keyword already exists in this project.');

  const info = db
    .prepare(
      `INSERT INTO keyword_definitions (project_id, keyword, definition, created_by)
       VALUES (?, ?, ?, ?)`
    )
    .run(projectId, cleanKeyword, cleanDefinition, createdBy);
  return decorate(getById(info.lastInsertRowid));
}

function updateDefinition(id, { definition }, user) {
  const row = getById(id);
  assertCanModify(row, user);
  const cleanDefinition = String(definition || '').trim();
  if (!cleanDefinition) throw new ApiError(400, 'A definition is required.');
  db.prepare(
    `UPDATE keyword_definitions SET definition = ?, updated_at = datetime('now') WHERE id = ?`
  ).run(cleanDefinition, id);
  return decorate(getById(id));
}

function setLock(id, locked, user) {
  const row = getById(id);
  // Unlocking is a "modify" action and is subject to the same ownership rule.
  if (row.locked && !locked) assertCanModify(row, user);
  db.prepare(
    `UPDATE keyword_definitions
     SET locked = ?, locked_by = ?, updated_at = datetime('now')
     WHERE id = ?`
  ).run(locked ? 1 : 0, locked ? user.id : null, id);
  return decorate(getById(id));
}

function deleteDefinition(id, user) {
  const row = getById(id);
  assertCanModify(row, user);
  db.prepare('DELETE FROM keyword_definitions WHERE id = ?').run(id);
}

module.exports = {
  listDefinitions,
  getById,
  createDefinition,
  updateDefinition,
  setLock,
  deleteDefinition,
};
