const db = require('../../db/connection');
const { NotFoundError } = require('../utils/errors');
const { computeReadability } = require('../utils/flesch');

// FR-FRE 1: Flesch Reading Ease Score + Flesch-Kincaid Grade Level for a policy document.
function getDocumentReadability(documentId) {
  const doc = db.prepare('SELECT id, name, content FROM documents WHERE id = ?').get(documentId);
  if (!doc) throw new NotFoundError('Document not found');

  const metrics = computeReadability(doc.content);
  return {
    documentId: doc.id,
    documentName: doc.name,
    ...metrics,
  };
}

module.exports = { getDocumentReadability };
