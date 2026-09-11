const asyncHandler = require('../utils/asyncHandler');
const service = require('../services/classificationTypes');

// List project-defined goal classification dimensions.
const listTypes = asyncHandler(async (req, res) => {
  res.json(await service.listTypes(req.params.projectId));
});

// PM adds a new classification dimension directly.
const createType = asyncHandler(async (req, res) => {
  const type = await service.createType(req.params.projectId, {
    label: req.body.label,
    options: req.body.options,
    createdBy: req.user.id,
  });
  res.locals.audit({ action: 'create', objectType: 'classification_type', objectId: type.id });
  res.status(201).json(type);
});

// An analyst requests a new dimension; a PM approves or rejects it.
const listRequests = asyncHandler(async (req, res) => {
  res.json(await service.listRequests(req.params.projectId));
});

const createRequest = asyncHandler(async (req, res) => {
  const request = await service.createRequest(req.params.projectId, {
    requestedBy: req.user.id,
    label: req.body.label,
    options: req.body.options,
    rationale: req.body.rationale,
  });
  res.locals.audit({
    action: 'create',
    objectType: 'classification_type_request',
    objectId: request.id,
  });
  res.status(201).json(request);
});

const decideRequest = asyncHandler(async (req, res) => {
  const result = await service.decideRequest(req.params.requestId, {
    decidedBy: req.user.id,
    decision: req.body.decision,
  });
  res.locals.audit({
    action: 'update',
    objectType: 'classification_type_request',
    objectId: Number(req.params.requestId),
    detail: result.status,
  });
  res.json(result);
});

module.exports = { listTypes, createType, listRequests, createRequest, decideRequest };
