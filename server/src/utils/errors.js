class ApiError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

class NotFoundError extends ApiError {
  constructor(message = 'Resource not found') {
    super(404, message);
  }
}

class ForbiddenError extends ApiError {
  constructor(message = 'You do not have permission to perform this action') {
    super(403, message);
  }
}

class UnauthorizedError extends ApiError {
  constructor(message = 'Authentication required') {
    super(401, message);
  }
}

class ConflictError extends ApiError {
  constructor(message = 'Conflicting state') {
    super(409, message);
  }
}

module.exports = { ApiError, NotFoundError, ForbiddenError, UnauthorizedError, ConflictError };
