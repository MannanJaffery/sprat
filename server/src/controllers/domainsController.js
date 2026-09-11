const asyncHandler = require('../utils/asyncHandler');
const domainsService = require('../services/domains');

const list = asyncHandler(async (req, res) => {
  res.json(await domainsService.listDomains(req.params.projectId));
});

const create = asyncHandler(async (req, res) => {
  const domain = await domainsService.createDomain(req.params.projectId, {
    name: req.body.name,
    createdBy: req.user.id,
  });
  res.locals.audit({ action: 'create', objectType: 'domain', objectId: domain.id });
  res.status(201).json(domain);
});

const update = asyncHandler(async (req, res) => {
  const domain = await domainsService.updateDomain(req.params.domainId, { name: req.body.name });
  res.locals.audit({ action: 'update', objectType: 'domain', objectId: domain.id });
  res.json(domain);
});

const remove = asyncHandler(async (req, res) => {
  await domainsService.deleteDomain(req.params.domainId);
  res.locals.audit({ action: 'delete', objectType: 'domain', objectId: Number(req.params.domainId) });
  res.status(204).send();
});

module.exports = { list, create, update, remove };
