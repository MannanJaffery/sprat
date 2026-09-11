const db = require('../../db/connection');
const { NotFoundError, ConflictError, ForbiddenError, ApiError } = require('../utils/errors');

function decorate(row) {
  return { ...row, locked: Boolean(row.locked) };
}

// Analysts create/update goal keyword definitions; guests view them.
async function listDefinitions(projectId) {
  const rows = await db.query(
    `SELECT k.*, c.name AS created_by_name, l.name AS locked_by_name
     FROM keyword_definitions k
     JOIN profiles c ON c.id = k.created_by
     LEFT JOIN profiles l ON l.id = k.locked_by
     WHERE k.project_id = $1
     ORDER BY k.keyword`,
    [projectId]
  );
  return rows.map(decorate);
}

async function getById(id) {
  const row = await db.queryOne('SELECT * FROM keyword_definitions WHERE id = $1', [id]);
  if (!row) throw new NotFoundError('Keyword definition not found');
  return row;
}

// A locked definition may only be changed or unlocked by the project manager or
// the analyst who first created it.
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

async function createDefinition(projectId, { keyword, definition, createdBy }) {
  const cleanKeyword = String(keyword || '').trim();
  const cleanDefinition = String(definition || '').trim();
  if (!cleanKeyword || !cleanDefinition) {
    throw new ApiError(400, 'A keyword and its definition are both required.');
  }
  const existing = await db.queryOne(
    'SELECT id FROM keyword_definitions WHERE project_id = $1 AND LOWER(keyword) = LOWER($2)',
    [projectId, cleanKeyword]
  );
  if (existing) throw new ConflictError('A definition for this keyword already exists in this project.');

  const inserted = await db.queryOne(
    `INSERT INTO keyword_definitions (project_id, keyword, definition, created_by)
     VALUES ($1, $2, $3, $4) RETURNING id`,
    [projectId, cleanKeyword, cleanDefinition, createdBy]
  );
  return decorate(await getById(inserted.id));
}

async function updateDefinition(id, { definition }, user) {
  const row = await getById(id);
  assertCanModify(row, user);
  const cleanDefinition = String(definition || '').trim();
  if (!cleanDefinition) throw new ApiError(400, 'A definition is required.');
  await db.query('UPDATE keyword_definitions SET definition = $1, updated_at = now() WHERE id = $2', [
    cleanDefinition,
    id,
  ]);
  return decorate(await getById(id));
}

async function setLock(id, locked, user) {
  const row = await getById(id);
  // Unlocking is a "modify" action and is subject to the same ownership rule.
  if (row.locked && !locked) assertCanModify(row, user);
  await db.query(
    `UPDATE keyword_definitions
     SET locked = $1, locked_by = $2, updated_at = now()
     WHERE id = $3`,
    [Boolean(locked), locked ? user.id : null, id]
  );
  return decorate(await getById(id));
}

async function deleteDefinition(id, user) {
  const row = await getById(id);
  assertCanModify(row, user);
  await db.query('DELETE FROM keyword_definitions WHERE id = $1', [id]);
}

module.exports = {
  listDefinitions,
  getById,
  createDefinition,
  updateDefinition,
  setLock,
  deleteDefinition,
};
