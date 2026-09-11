const asyncHandler = require('../utils/asyncHandler');
const scenariosService = require('../services/scenarios');

// Manage Scenarios.
const list = asyncHandler(async (req, res) => {
  res.json(
    await scenariosService.listScenarios(req.params.projectId, {
      status: req.query.status,
      actor: req.query.actor,
      goalId: req.query.goalId,
      search: req.query.search,
    })
  );
});

const getOne = asyncHandler(async (req, res) => {
  res.json(await scenariosService.getScenarioById(req.params.scenarioId));
});

const create = asyncHandler(async (req, res) => {
  const id = await scenariosService.createScenario(req.params.projectId, {
    ...req.body,
    createdBy: req.user.id,
  });
  res.locals.audit({ action: 'create', objectType: 'scenario', objectId: id });
  res.status(201).json(await scenariosService.getScenarioById(id));
});

const update = asyncHandler(async (req, res) => {
  await scenariosService.updateScenario(req.params.scenarioId, req.body);
  res.locals.audit({ action: 'update', objectType: 'scenario', objectId: Number(req.params.scenarioId) });
  res.json(await scenariosService.getScenarioById(req.params.scenarioId));
});

const remove = asyncHandler(async (req, res) => {
  await scenariosService.deleteScenario(req.params.scenarioId);
  res.locals.audit({ action: 'delete', objectType: 'scenario', objectId: Number(req.params.scenarioId) });
  res.status(204).send();
});

// Reuse/link an existing goal into this scenario.
const linkGoal = asyncHandler(async (req, res) => {
  await scenariosService.linkGoal(req.params.scenarioId, req.body.goalId);
  res.locals.audit({ action: 'update', objectType: 'scenario', objectId: Number(req.params.scenarioId) });
  res.json(await scenariosService.getScenarioById(req.params.scenarioId));
});

const unlinkGoal = asyncHandler(async (req, res) => {
  await scenariosService.unlinkGoal(req.params.scenarioId, req.params.goalId);
  res.locals.audit({ action: 'update', objectType: 'scenario', objectId: Number(req.params.scenarioId) });
  res.json(await scenariosService.getScenarioById(req.params.scenarioId));
});

module.exports = { list, getOne, create, update, remove, linkGoal, unlinkGoal };
