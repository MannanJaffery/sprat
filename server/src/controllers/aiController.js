const asyncHandler = require('../utils/asyncHandler');
const goalsService = require('../services/goals');
const projectsService = require('../services/projects');
const conflictDetector = require('../services/ai/conflictDetector');
const summaryService = require('../services/ai/summary');
const chatService = require('../services/ai/chat');

async function visibleGoals(req) {
  const goals = await goalsService.listGoals(req.params.projectId);
  return goalsService.filterGoalsByDomainAccess(goals, req.projectMembership);
}

const detectConflicts = asyncHandler(async (req, res) => {
  const goals = await visibleGoals(req);
  res.json(await conflictDetector.detectConflicts(goals));
});

const generateSummary = asyncHandler(async (req, res) => {
  const project = await projectsService.getProjectById(req.params.projectId);
  const goals = await visibleGoals(req);
  res.json(await summaryService.generateProjectSummary(project, goals));
});

const chat = asyncHandler(async (req, res) => {
  let project = null;
  if (req.body.projectId) {
    project = await projectsService.getProjectById(req.body.projectId).catch(() => null);
  }
  const reply = await chatService.converse({ user: req.user, project, history: req.body.history });
  res.json({ reply });
});

module.exports = { detectConflicts, generateSummary, chat };
