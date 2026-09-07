const db = require('../../db/connection');
const { NotFoundError } = require('../utils/errors');

// FR-ADM 5: analysts/guests view documents within a domain in alphabetical order.
function listDocuments(projectId, { domainId } = {}) {
  if (domainId) {
    return db
      .prepare(
        'SELECT * FROM documents WHERE project_id = ? AND domain_id = ? ORDER BY name'
      )
      .all(projectId, domainId);
  }
  return db.prepare('SELECT * FROM documents WHERE project_id = ? ORDER BY name').all(projectId);
}

function getDocumentById(id) {
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(id);
  if (!doc) throw new NotFoundError('Document not found');
  return doc;
}

// FR-ADM 1: PM adds a policy document to the repository and assigns a domain.
function createDocument(projectId, { name, content, domainId, sourceUrl, createdBy }) {
  const info = db
    .prepare(
      `INSERT INTO documents (project_id, domain_id, name, content, source_url, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(projectId, domainId || null, name, content || '', sourceUrl || null, createdBy);
  return getDocumentById(info.lastInsertRowid);
}

function updateDocument(id, { name, content, domainId, sourceUrl }) {
  const doc = getDocumentById(id);
  db.prepare(
    `UPDATE documents SET name = ?, content = ?, domain_id = ?, source_url = ? WHERE id = ?`
  ).run(
    name ?? doc.name,
    content ?? doc.content,
    domainId !== undefined ? domainId : doc.domain_id,
    sourceUrl !== undefined ? sourceUrl : doc.source_url,
    id
  );
  return getDocumentById(id);
}

function deleteDocument(id) {
  getDocumentById(id);
  db.prepare('DELETE FROM documents WHERE id = ?').run(id);
}

module.exports = { listDocuments, getDocumentById, createDocument, updateDocument, deleteDocument };
