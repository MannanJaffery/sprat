const asyncHandler = require('../utils/asyncHandler');
const documentsService = require('../services/documents');
const { assertDomainAllowed } = require('../middleware/projectAccess');

const list = asyncHandler(async (req, res) => {
  const docs = await documentsService.listDocuments(req.params.projectId, {
    domainId: req.query.domainId,
  });
  const { restricted, allowedDomainIds } = req.projectMembership;
  const visible = restricted
    ? docs.filter((d) => d.domain_id != null && allowedDomainIds.includes(d.domain_id))
    : docs;
  res.json(visible);
});

const getOne = asyncHandler(async (req, res) => {
  const doc = await documentsService.getDocumentById(req.params.documentId);
  assertDomainAllowed(req, doc.domain_id);
  res.json(doc);
});

const create = asyncHandler(async (req, res) => {
  const doc = await documentsService.createDocument(req.params.projectId, {
    ...req.body,
    createdBy: req.user.id,
  });
  res.locals.audit({ action: 'create', objectType: 'document', objectId: doc.id });
  res.status(201).json(doc);
});

const update = asyncHandler(async (req, res) => {
  const doc = await documentsService.updateDocument(req.params.documentId, req.body);
  res.locals.audit({ action: 'update', objectType: 'document', objectId: doc.id });
  res.json(doc);
});

const remove = asyncHandler(async (req, res) => {
  await documentsService.deleteDocument(req.params.documentId);
  res.locals.audit({ action: 'delete', objectType: 'document', objectId: Number(req.params.documentId) });
  res.status(204).send();
});

module.exports = { list, getOne, create, update, remove };
