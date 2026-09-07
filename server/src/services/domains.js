const db = require('../../db/connection');
const { NotFoundError, ConflictError } = require('../utils/errors');

function listDomains(projectId) {
  return db.prepare('SELECT * FROM domains WHERE project_id = ? ORDER BY name').all(projectId);
}

function getDomainById(id) {
  const domain = db.prepare('SELECT * FROM domains WHERE id = ?').get(id);
  if (!domain) throw new NotFoundError('Domain not found');
  return domain;
}

// FR-ADM 6: PM creates a new domain (e.g. Healthcare, Financial, E-commerce).
function createDomain(projectId, { name, createdBy }) {
  const existing = db
    .prepare('SELECT id FROM domains WHERE project_id = ? AND name = ?')
    .get(projectId, name);
  if (existing) throw new ConflictError('A domain with this name already exists in this project.');
  const info = db
    .prepare('INSERT INTO domains (project_id, name, created_by) VALUES (?, ?, ?)')
    .run(projectId, name, createdBy);
  return getDomainById(info.lastInsertRowid);
}

// FR-ADM 2: PM edits the domain name.
function updateDomain(id, { name }) {
  getDomainById(id);
  db.prepare('UPDATE domains SET name = ? WHERE id = ?').run(name, id);
  return getDomainById(id);
}

// FR-ADM 3: PM deletes a domain.
function deleteDomain(id) {
  getDomainById(id);
  db.prepare('UPDATE documents SET domain_id = NULL WHERE domain_id = ?').run(id);
  db.prepare('DELETE FROM domains WHERE id = ?').run(id);
}

module.exports = { listDomains, getDomainById, createDomain, updateDomain, deleteDomain };
