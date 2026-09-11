const asyncHandler = require('../utils/asyncHandler');
const goalsService = require('../services/goals');
const documentsService = require('../services/documents');
const { checkGoalGrammar } = require('../services/grammarCheck');
const { getGoalCrossReferences } = require('../services/crossReference');
const { assertDomainAllowed } = require('../middleware/projectAccess');
const { ForbiddenError } = require('../utils/errors');

async function domainOfDocument(projectId, documentId) {
  const doc = await documentsService.getDocumentById(documentId);
  if (doc.project_id !== Number(projectId)) throw new ForbiddenError('Document does not belong to this project.');
  return doc.domain_id;
}

// Manage Goals.
const list = asyncHandler(async (req, res) => {
  const goals = await goalsService.listGoals(req.params.projectId, {
    documentId: req.query.documentId,
    taxonomyCategory: req.query.taxonomyCategory,
    taxonomySubtype: req.query.taxonomySubtype,
    granularity: req.query.granularity,
    observable: req.query.observable,
    actor: req.query.actor,
    legislation: req.query.legislation,
    subjectClassification: req.query.subjectClassification,
    search: req.query.search,
  });

  const { restricted, allowedDomainIds } = req.projectMembership;
  if (!restricted) return res.json(goals);

  const visible = [];
  for (const g of goals) {
    const domainId = await domainOfDocument(req.params.projectId, g.document_id);
    if (domainId != null && allowedDomainIds.includes(domainId)) visible.push(g);
  }
  res.json(visible);
});

const getOne = asyncHandler(async (req, res) => {
  const goal = await goalsService.getGoalById(req.params.goalId);
  assertDomainAllowed(req, await domainOfDocument(goal.project_id, goal.document_id));
  res.json(goal);
});

const create = asyncHandler(async (req, res) => {
  const goalId = await goalsService.createGoal(req.params.projectId, {
    ...req.body,
    createdBy: req.user.id,
  });
  res.locals.audit({ action: 'create', objectType: 'goal', objectId: goalId });
  res.status(201).json(await goalsService.getGoalById(goalId));
});

const update = asyncHandler(async (req, res) => {
  await goalsService.updateGoal(req.params.goalId, req.body);
  res.locals.audit({ action: 'update', objectType: 'goal', objectId: Number(req.params.goalId) });
  res.json(await goalsService.getGoalById(req.params.goalId));
});

const remove = asyncHandler(async (req, res) => {
  await goalsService.deleteGoal(req.params.goalId);
  res.locals.audit({ action: 'delete', objectType: 'goal', objectId: Number(req.params.goalId) });
  res.status(204).send();
});

// Replace this goal with another, auto-propagating policy/scenario links.
const replace = asyncHandler(async (req, res) => {
  const result = await goalsService.replaceGoal(req.params.goalId, req.body.newGoalId);
  res.locals.audit({ action: 'delete', objectType: 'goal', objectId: Number(req.params.goalId) });
  res.locals.audit({ action: 'update', objectType: 'goal', objectId: req.body.newGoalId });
  res.json({ ...result, replacementGoal: await goalsService.getGoalById(req.body.newGoalId) });
});

// Occurrence count of every goal within a policy document.
const documentOccurrences = asyncHandler(async (req, res) => {
  res.json(await goalsService.getDocumentGoalOccurrences(req.params.documentId));
});

// Count of distinct goals within a policy document.
const documentDistinctGoalCount = asyncHandler(async (req, res) => {
  res.json({ count: await goalsService.getDocumentDistinctGoalCount(req.params.documentId) });
});

// Traceability of a goal across policies and scenarios.
const traceability = asyncHandler(async (req, res) => {
  res.json(await goalsService.getGoalTraceability(req.params.goalId));
});

const linkDocument = asyncHandler(async (req, res) => {
  await goalsService.linkGoalToDocument(req.params.goalId, req.body.documentId);
  res.locals.audit({ action: 'update', objectType: 'goal', objectId: Number(req.params.goalId) });
  res.json(await goalsService.getGoalTraceability(req.params.goalId));
});

// Rule-based grammar/conformance check of this goal's statement — no AI call.
const grammarCheck = asyncHandler(async (req, res) => {
  const goal = await goalsService.getGoalById(req.params.goalId);
  assertDomainAllowed(req, await domainOfDocument(goal.project_id, goal.document_id));
  res.json(checkGoalGrammar(goal));
});

// Other goals related to this one by document, taxonomy, subject, or legislation.
const crossReferences = asyncHandler(async (req, res) => {
  const goal = await goalsService.getGoalById(req.params.goalId);
  assertDomainAllowed(req, await domainOfDocument(goal.project_id, goal.document_id));
  res.json(await getGoalCrossReferences(goal));
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
  grammarCheck,
  crossReferences,
};
