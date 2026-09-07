const asyncHandler = require('../utils/asyncHandler');
const goalsService = require('../services/goals');
const documentsService = require('../services/documents');
const { assertDomainAllowed } = require('../middleware/projectAccess');
const { ForbiddenError } = require('../utils/errors');

function domainOfDocument(projectId, documentId) {
  const doc = documentsService.getDocumentById(documentId);
  if (doc.project_id !== Number(projectId)) throw new ForbiddenError('Document does not belong to this project.');
  return doc.domain_id;
}

// FR-GSM 1/3/4/7/8: Manage Goals.
const list = asyncHandler(async (req, res) => {
  const goals = goalsService.listGoals(req.params.projectId, {
    documentId: req.query.documentId,
    taxonomyCategory: req.query.taxonomyCategory,
    granularity: req.query.granularity,
    search: req.query.search,
  });

  const { restricted, allowedDomainIds } = req.projectMembership;
  if (!restricted) return res.json(goals);

  const visible = goals.filter((g) => {
    const domainId = domainOfDocument(req.params.projectId, g.document_id);
    return domainId != null && allowedDomainIds.includes(domainId);
  });
  res.json(visible);
});

const getOne = asyncHandler(async (req, res) => {
  const goal = goalsService.getGoalById(req.params.goalId);
  assertDomainAllowed(req, domainOfDocument(goal.project_id, goal.document_id));
  res.json(goal);
});

const create = asyncHandler(async (req, res) => {
  const goalId = goalsService.createGoal(req.params.projectId, {
    ...req.body,
    createdBy: req.user.id,
  });
  res.locals.audit({ action: 'create', objectType: 'goal', objectId: goalId });
  res.status(201).json(goalsService.getGoalById(goalId));
});

const update = asyncHandler(async (req, res) => {
  goalsService.updateGoal(req.params.goalId, req.body);
  res.locals.audit({ action: 'update', objectType: 'goal', objectId: Number(req.params.goalId) });
  res.json(goalsService.getGoalById(req.params.goalId));
});

const remove = asyncHandler(async (req, res) => {
  goalsService.deleteGoal(req.params.goalId);
  res.locals.audit({ action: 'delete', objectType: 'goal', objectId: Number(req.params.goalId) });
  res.status(204).send();
});

// FR-GSM 9: replace this goal with another, auto-propagating policy/scenario links.
const replace = asyncHandler(async (req, res) => {
  const result = goalsService.replaceGoal(req.params.goalId, req.body.newGoalId);
  res.locals.audit({ action: 'delete', objectType: 'goal', objectId: Number(req.params.goalId) });
  res.locals.audit({ action: 'update', objectType: 'goal', objectId: req.body.newGoalId });
  res.json({ ...result, replacementGoal: goalsService.getGoalById(req.body.newGoalId) });
});

// FR-GSM 11: occurrence count of every goal within a policy document.
const documentOccurrences = asyncHandler(async (req, res) => {
  res.json(goalsService.getDocumentGoalOccurrences(req.params.documentId));
});

// FR-GSM 12: count of distinct goals within a policy document.
const documentDistinctGoalCount = asyncHandler(async (req, res) => {
  res.json({ count: goalsService.getDocumentDistinctGoalCount(req.params.documentId) });
});

// FR-GSM 10 / FR6: traceability of a goal across policies and scenarios.
const traceability = asyncHandler(async (req, res) => {
  res.json(goalsService.getGoalTraceability(req.params.goalId));
});

const linkDocument = asyncHandler(async (req, res) => {
  goalsService.linkGoalToDocument(req.params.goalId, req.body.documentId);
  res.locals.audit({ action: 'update', objectType: 'goal', objectId: Number(req.params.goalId) });
  res.json(goalsService.getGoalTraceability(req.params.goalId));
});

module.exports = {
  list,
  getOne,
  create,
  update,
  remove,
  replace,
  documentOccurrences,
  documentDistinctGoalCount,
  traceability,
  linkDocument,
};
