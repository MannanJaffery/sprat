const asyncHandler = require('../utils/asyncHandler');
const readabilityService = require('../services/readability');

// FR-FRE 1: Flesch Reading Ease + Flesch-Kincaid Grade Level for a policy document.
const getReadability = asyncHandler(async (req, res) => {
  res.json(readabilityService.getDocumentReadability(req.params.documentId));
});

module.exports = { getReadability };
