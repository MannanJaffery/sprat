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

// FR-GSM 5: project-defined goal classification dimensions.
function listTypes(projectId) {
  return db
    .prepare('SELECT * FROM classification_types WHERE project_id = ? ORDER BY created_at')
    .all(projectId)
    .map(rowToType);
}

function getTypeById(id) {
  const row = db.prepare('SELECT * FROM classification_types WHERE id = ?').get(id);
  if (!row) throw new NotFoundError('Classification type not found');
  return row;
}

function createType(projectId, { label, options, createdBy }) {
  const cleanLabel = String(label || '').trim();
  if (!cleanLabel) throw new ApiError(400, 'A label is required.');
  const parsedOptions = parseOptions(options);

  let key = slugify(cleanLabel) || 'type';
  const existing = db
    .prepare('SELECT type_key FROM classification_types WHERE project_id = ? AND type_key LIKE ?')
    .all(projectId, `${key}%`)
    .map((r) => r.type_key);
  if (existing.includes(key)) {
    let n = 2;
    while (existing.includes(`${key}_${n}`)) n += 1;
    key = `${key}_${n}`;
  }

  const nameClash = db
    .prepare('SELECT id FROM classification_types WHERE project_id = ? AND label = ?')
    .get(projectId, cleanLabel);
  if (nameClash) throw new ConflictError('A classification type with this label already exists.');

  const info = db
    .prepare(
      `INSERT INTO classification_types (project_id, type_key, label, options, created_by)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(projectId, key, cleanLabel, JSON.stringify(parsedOptions), createdBy);
  return rowToType(getTypeById(info.lastInsertRowid));
}

// FR-GSM 6: an analyst requests a new classification type; a PM approves or rejects it.
function listRequests(projectId) {
  return db
    .prepare(
      `SELECT r.*, u.name AS requested_by_name, d.name AS decided_by_name
       FROM classification_type_requests r
       JOIN users u ON u.id = r.requested_by
       LEFT JOIN users d ON d.id = r.decided_by
       WHERE r.project_id = ?
       ORDER BY r.created_at DESC`
    )
    .all(projectId)
    .map((r) => ({ ...r, options: JSON.parse(r.options) }));
}

function createRequest(projectId, { requestedBy, label, options, rationale }) {
  const cleanLabel = String(label || '').trim();
  if (!cleanLabel) throw new ApiError(400, 'A label is required.');
  const parsedOptions = parseOptions(options);
  const info = db
    .prepare(
      `INSERT INTO classification_type_requests (project_id, requested_by, label, options, rationale)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(projectId, requestedBy, cleanLabel, JSON.stringify(parsedOptions), rationale || null);
  return db.prepare('SELECT * FROM classification_type_requests WHERE id = ?').get(info.lastInsertRowid);
}

const decideRequest = db.transaction((requestId, { decidedBy, decision }) => {
  const request = db
    .prepare('SELECT * FROM classification_type_requests WHERE id = ?')
    .get(requestId);
  if (!request) throw new NotFoundError('Request not found');
  if (request.status !== 'pending') {
    throw new ConflictError('This request has already been decided.');
  }

  let createdTypeId = null;
  if (decision === 'approved') {
    const type = createType(request.project_id, {
      label: request.label,
      options: JSON.parse(request.options),
      createdBy: decidedBy,
    });
    createdTypeId = type.id;
  }

  db.prepare(
    `UPDATE classification_type_requests
     SET status = ?, decided_by = ?, decided_at = datetime('now'), created_type_id = ?
     WHERE id = ?`
  ).run(decision, decidedBy, createdTypeId, requestId);

  return { requestId, status: decision, createdTypeId };
});

module.exports = {
  listTypes,
  getTypeById,
  createType,
  listRequests,
  createRequest,
  decideRequest,
};
