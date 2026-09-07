const { validationResult } = require('express-validator');
const { ApiError } = require('../utils/errors');

// Runs after an array of express-validator checks; turns the first failure into a 400.
function validate(req, res, next) {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  const details = errors.array().map((e) => ({ field: e.path, message: e.msg }));
  next(new ApiError(400, 'Validation failed', details));
}

module.exports = validate;
