const asyncHandler = require('../utils/asyncHandler');
const service = require('../services/keywordDefinitions');

// Goal keyword definitions with lock/unlock.
const list = asyncHandler(async (req, res) => {
  res.json(await service.listDefinitions(req.params.projectId));
});

const create = asyncHandler(async (req, res) => {
  const def = await service.createDefinition(req.params.projectId, {
    keyword: req.body.keyword,
    definition: req.body.definition,
    createdBy: req.user.id,
  });
  res.locals.audit({ action: 'create', objectType: 'keyword_definition', objectId: def.id });
  res.status(201).json(def);
});

const update = asyncHandler(async (req, res) => {
  const def = await service.updateDefinition(req.params.defId, { definition: req.body.definition }, req.user);
  res.locals.audit({ action: 'update', objectType: 'keyword_definition', objectId: def.id });
  res.json(def);
});

const setLock = asyncHandler(async (req, res) => {
  const def = await service.setLock(req.params.defId, req.body.locked === true, req.user);
  res.locals.audit({
    action: 'update',
    objectType: 'keyword_definition',
    objectId: def.id,
    detail: def.locked ? 'locked' : 'unlocked',
  });
  res.json(def);
});

const remove = asyncHandler(async (req, res) => {
  await service.deleteDefinition(req.params.defId, req.user);
  res.locals.audit({
    action: 'delete',
    objectType: 'keyword_definition',
    objectId: Number(req.params.defId),
  });
  res.status(204).send();
});

module.exports = { list, create, update, setLock, remove };
