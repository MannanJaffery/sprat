const asyncHandler = require('../utils/asyncHandler');
const classificationsService = require('../services/goalClassifications');

// FR-ADM 7: submit this analyst's independent classification for a goal.
const submit = asyncHandler(async (req, res) => {
  classificationsService.submitClassifications(req.params.goalId, req.user.id, req.body);
  res.locals.audit({ action: 'update', objectType: 'goal_classification', objectId: Number(req.params.goalId) });
  res.json(classificationsService.getClassifications(req.params.goalId, req.user));
});

// Withholds other analysts' values until the requesting analyst has submitted their own.
const list = asyncHandler(async (req, res) => {
  res.json(classificationsService.getClassifications(req.params.goalId, req.user));
});

const diff = asyncHandler(async (req, res) => {
  res.json(classificationsService.getClassificationDiff(req.params.goalId));
});

const options = asyncHandler(async (req, res) => {
  res.json({
    types: classificationsService.CLASSIFICATION_TYPES,
    valueOptions: classificationsService.VALUE_OPTIONS,
  });
});

module.exports = { submit, list, diff, options };
