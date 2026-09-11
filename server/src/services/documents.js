const db = require('../../db/connection');
const { NotFoundError } = require('../utils/errors');

// Analysts/guests view documents within a domain in alphabetical order.
async function listDocuments(projectId, { domainId } = {}) {
  if (domainId) {
    return db.query('SELECT * FROM documents WHERE project_id = $1 AND domain_id = $2 ORDER BY name', [
      projectId,
      domainId,
    ]);
  }
  return db.query('SELECT * FROM documents WHERE project_id = $1 ORDER BY name', [projectId]);
}

async function getDocumentById(id) {
  const doc = await db.queryOne('SELECT * FROM documents WHERE id = $1', [id]);
  if (!doc) throw new NotFoundError('Document not found');
  return doc;
}

// PM adds a policy document to the repository and assigns a domain.
async function createDocument(projectId, { name, content, domainId, sourceUrl, createdBy }) {
  return db.queryOne(
    `INSERT INTO documents (project_id, domain_id, name, content, source_url, created_by)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [projectId, domainId || null, name, content || '', sourceUrl || null, createdBy]
  );
}

async function updateDocument(id, { name, content, domainId, sourceUrl }) {
  const doc = await getDocumentById(id);
  return db.queryOne(
    `UPDATE documents SET name = $1, content = $2, domain_id = $3, source_url = $4
     WHERE id = $5
     RETURNING *`,
    [
      name ?? doc.name,
      content ?? doc.content,
      domainId !== undefined ? domainId : doc.domain_id,
      sourceUrl !== undefined ? sourceUrl : doc.source_url,
      id,
    ]
  );
}

async function deleteDocument(id) {
  await getDocumentById(id);
  await db.query('DELETE FROM documents WHERE id = $1', [id]);
}

module.exports = { listDocuments, getDocumentById, createDocument, updateDocument, deleteDocument };
