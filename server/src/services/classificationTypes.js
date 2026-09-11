const db = require('../../db/connection');
const { NotFoundError, ConflictError, ApiError } = require('../utils/errors');

function slugify(label) {
  return String(label)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40);
}

function parseOptions(raw) {
  const options = Array.isArray(raw) ? raw.map((o) => String(o).trim()).filter(Boolean) : [];
  const unique = [...new Set(options)];
  if (unique.length < 2) {
    throw new ApiError(400, 'A classification type needs at least two distinct options.');
  }
  return unique;
}

function rowToType(row) {
  return {
    id: row.id,
    key: row.type_key,
    label: row.label,
    options: JSON.parse(row.options),
    custom: true,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

// Project-defined goal classification dimensions.
async function listTypes(projectId) {
  const rows = await db.query('SELECT * FROM classification_types WHERE project_id = $1 ORDER BY created_at', [
    projectId,
  ]);
  return rows.map(rowToType);
}

async function getTypeById(id, executor = db) {
  const row = await executor.queryOne('SELECT * FROM classification_types WHERE id = $1', [id]);
  if (!row) throw new NotFoundError('Classification type not found');
  return row;
}

// Shared by both the direct "PM adds a dimension" path and "request approved" path.
async function createTypeWithExecutor(executor, projectId, { label, options, createdBy }) {
  const cleanLabel = String(label || '').trim();
  if (!cleanLabel) throw new ApiError(400, 'A label is required.');
  const parsedOptions = parseOptions(options);

  let key = slugify(cleanLabel) || 'type';
  const existingRows = await executor.query(
    'SELECT type_key FROM classification_types WHERE project_id = $1 AND type_key LIKE $2',
    [projectId, `${key}%`]
  );
  const existing = existingRows.map((r) => r.type_key);
  if (existing.includes(key)) {
    let n = 2;
    while (existing.includes(`${key}_${n}`)) n += 1;
    key = `${key}_${n}`;
  }

  const nameClash = await executor.queryOne(
    'SELECT id FROM classification_types WHERE project_id = $1 AND label = $2',
    [projectId, cleanLabel]
  );
  if (nameClash) throw new ConflictError('A classification type with this label already exists.');

  const inserted = await executor.queryOne(
    `INSERT INTO classification_types (project_id, type_key, label, options, created_by)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [projectId, key, cleanLabel, JSON.stringify(parsedOptions), createdBy]
  );
  return rowToType(await getTypeById(inserted.id, executor));
}

async function createType(projectId, data) {
  return createTypeWithExecutor(db, projectId, data);
}

// An analyst requests a new classification type; a PM approves or rejects it.
async function listRequests(projectId) {
  const rows = await db.query(
    `SELECT r.*, u.name AS requested_by_name, d.name AS decided_by_name
     FROM classification_type_requests r
     JOIN profiles u ON u.id = r.requested_by
     LEFT JOIN profiles d ON d.id = r.decided_by
     WHERE r.project_id = $1
     ORDER BY r.created_at DESC`,
    [projectId]
  );
  return rows.map((r) => ({ ...r, options: JSON.parse(r.options) }));
}

async function createRequest(projectId, { requestedBy, label, options, rationale }) {
  const cleanLabel = String(label || '').trim();
  if (!cleanLabel) throw new ApiError(400, 'A label is required.');
  const parsedOptions = parseOptions(options);
  return db.queryOne(
    `INSERT INTO classification_type_requests (project_id, requested_by, label, options, rationale)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [projectId, requestedBy, cleanLabel, JSON.stringify(parsedOptions), rationale || null]
  );
}

async function decideRequest(requestId, { decidedBy, decision }) {
  return db.withTransaction(async (tx) => {
    const request = await tx.queryOne('SELECT * FROM classification_type_requests WHERE id = $1', [
      requestId,
    ]);
    if (!request) throw new NotFoundError('Request not found');
    if (request.status !== 'pending') {
      throw new ConflictError('This request has already been decided.');
    }

    let createdTypeId = null;
    if (decision === 'approved') {
      const type = await createTypeWithExecutor(tx, request.project_id, {
        label: request.label,
        options: JSON.parse(request.options),
        createdBy: decidedBy,
      });
      createdTypeId = type.id;
    }

    await tx.query(
      `UPDATE classification_type_requests
       SET status = $1, decided_by = $2, decided_at = now(), created_type_id = $3
       WHERE id = $4`,
      [decision, decidedBy, createdTypeId, requestId]
    );

    return { requestId, status: decision, createdTypeId };
  });
}

module.exports = {
  listTypes,
  getTypeById,
  createType,
  listRequests,
  createRequest,
  decideRequest,
};
