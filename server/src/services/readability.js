const db = require('../../db/connection');
const { NotFoundError } = require('../utils/errors');
const { computeReadability } = require('../utils/flesch');

// Flesch Reading Ease Score + Flesch-Kincaid Grade Level for a policy document.
async function getDocumentReadability(documentId) {
  const doc = await db.queryOne('SELECT id, name, content FROM documents WHERE id = $1', [documentId]);
  if (!doc) throw new NotFoundError('Document not found');

  const metrics = computeReadability(doc.content);
  return {
    documentId: doc.id,
    documentName: doc.name,
    ...metrics,
  };
}

module.exports = { getDocumentReadability };
