const db = require('../../db/connection');
const { NotFoundError, ConflictError } = require('../utils/errors');

async function listDomains(projectId) {
  return db.query('SELECT * FROM domains WHERE project_id = $1 ORDER BY name', [projectId]);
}

async function getDomainById(id) {
  const domain = await db.queryOne('SELECT * FROM domains WHERE id = $1', [id]);
  if (!domain) throw new NotFoundError('Domain not found');
  return domain;
}

// PM creates a new domain (e.g. Healthcare, Financial, E-commerce).
async function createDomain(projectId, { name, createdBy }) {
  const existing = await db.queryOne('SELECT id FROM domains WHERE project_id = $1 AND name = $2', [
    projectId,
    name,
  ]);
  if (existing) throw new ConflictError('A domain with this name already exists in this project.');
  const domain = await db.queryOne(
    'INSERT INTO domains (project_id, name, created_by) VALUES ($1, $2, $3) RETURNING *',
    [projectId, name, createdBy]
  );
  return domain;
}

// PM edits the domain name.
async function updateDomain(id, { name }) {
  await getDomainById(id);
  await db.query('UPDATE domains SET name = $1 WHERE id = $2', [name, id]);
  return getDomainById(id);
}

// PM deletes a domain.
async function deleteDomain(id) {
  await getDomainById(id);
  await db.query('UPDATE documents SET domain_id = NULL WHERE domain_id = $1', [id]);
  await db.query('DELETE FROM domains WHERE id = $1', [id]);
}

module.exports = { listDomains, getDomainById, createDomain, updateDomain, deleteDomain };
