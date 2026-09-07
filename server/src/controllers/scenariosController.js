const asyncHandler = require('../utils/asyncHandler');
const scenariosService = require('../services/scenarios');

// FR-SSM 1/2/3/6: Manage Scenarios.
const list = asyncHandler(async (req, res) => {
  res.json(scenariosService.listScenarios(req.params.projectId));
});

const getOne = asyncHandler(async (req, res) => {
  res.json(scenariosService.getScenarioById(req.params.scenarioId));
});

const create = asyncHandler(async (req, res) => {
  const id = scenariosService.createScenario(req.params.projectId, {
    ...req.body,
    createdBy: req.user.id,
  });
  res.locals.audit({ action: 'create', objectType: 'scenario', objectId: id });
  res.status(201).json(scenariosService.getScenarioById(id));
});

const update = asyncHandler(async (req, res) => {
  scenariosService.updateScenario(req.params.scenarioId, req.body);
  res.locals.audit({ action: 'update', objectType: 'scenario', objectId: Number(req.params.scenarioId) });
  res.json(scenariosService.getScenarioById(req.params.scenarioId));
});

const remove = asyncHandler(async (req, res) => {
  scenariosService.deleteScenario(req.params.scenarioId);
  res.locals.audit({ action: 'delete', objectType: 'scenario', objectId: Number(req.params.scenarioId) });
  res.status(204).send();
});

// FR-SSM 4: reuse/link an existing goal into this scenario.
const linkGoal = asyncHandler(async (req, res) => {
  scenariosService.linkGoal(req.params.scenarioId, req.body.goalId);
  res.locals.audit({ action: 'update', objectType: 'scenario', objectId: Number(req.params.scenarioId) });
  res.json(scenariosService.getScenarioById(req.params.scenarioId));
});

const unlinkGoal = asyncHandler(async (req, res) => {
  scenariosService.unlinkGoal(req.params.scenarioId, req.params.goalId);
  res.locals.audit({ action: 'update', objectType: 'scenario', objectId: Number(req.params.scenarioId) });
  res.json(scenariosService.getScenarioById(req.params.scenarioId));
});

module.exports = { list, getOne, create, update, remove, linkGoal, unlinkGoal };
