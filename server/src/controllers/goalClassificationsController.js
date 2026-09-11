const asyncHandler = require('../utils/asyncHandler');
const classificationsService = require('../services/goalClassifications');

// Submit this analyst's independent classification for a goal (all dimensions,
// built-in and project-defined, in one call).
const submit = asyncHandler(async (req, res) => {
  await classificationsService.submitClassifications(req.params.goalId, req.user.id, req.body);
  res.locals.audit({
    action: 'update',
    objectType: 'goal_classification',
    objectId: Number(req.params.goalId),
  });
  res.json(await classificationsService.getClassifications(req.params.goalId, req.user));
});

// Withholds other analysts' values until the requesting analyst has submitted their own.
const list = asyncHandler(async (req, res) => {
  res.json(await classificationsService.getClassifications(req.params.goalId, req.user));
});

const diff = asyncHandler(async (req, res) => {
  res.json(await classificationsService.getClassificationDiff(req.params.goalId));
});

// The full set of dimensions (built-in + project-defined) and their options.
const options = asyncHandler(async (req, res) => {
  const { all } = await classificationsService.getTypesForGoal(req.params.goalId);
  res.json({
    types: all.map((t) => t.key),
    labels: Object.fromEntries(all.map((t) => [t.key, t.label])),
    valueOptions: Object.fromEntries(all.map((t) => [t.key, t.options])),
    custom: all.filter((t) => t.custom).map((t) => t.key),
  });
});

module.exports = { submit, list, diff, options };
