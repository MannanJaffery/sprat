const asyncHandler = require('../utils/asyncHandler');
const goalsService = require('../services/goals');
const scenariosService = require('../services/scenarios');
const documentsService = require('../services/documents');
const { ForbiddenError } = require('../utils/errors');

function domainOfDocument(projectId, documentId) {
  const doc = documentsService.getDocumentById(documentId);
  if (doc.project_id !== Number(projectId)) throw new ForbiddenError('Document does not belong to this project.');
  return doc.domain_id;
}

// FR8 (FR-GSM 16/17, FR-SSM 7): a single attribute-based search across goals and
// scenarios in a project. Guest domain restrictions are applied to the goal results.
const search = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  const goalFilters = {
    taxonomyCategory: req.query.taxonomyCategory,
    taxonomySubtype: req.query.taxonomySubtype,
    granularity: req.query.granularity,
    observable: req.query.observable,
    actor: req.query.actor,
    legislation: req.query.legislation,
    subjectClassification: req.query.subjectClassification,
    documentId: req.query.documentId,
    search: req.query.q,
  };
  let goals = goalsService.listGoals(projectId, goalFilters);

  const { restricted, allowedDomainIds } = req.projectMembership;
  if (restricted) {
    goals = goals.filter((g) => {
      const domainId = domainOfDocument(projectId, g.document_id);
      return domainId != null && allowedDomainIds.includes(domainId);
    });
  }

  const scenarios = scenariosService.listScenarios(projectId, {
    status: req.query.status,
    actor: req.query.actor,
    goalId: req.query.goalId,
    search: req.query.q,
  });

  res.json({ goals, scenarios });
});

module.exports = { search };
