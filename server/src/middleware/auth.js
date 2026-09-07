const { verifyToken } = require('../utils/jwt');
const { UnauthorizedError, ForbiddenError } = require('../utils/errors');
const db = require('../../db/connection');

const COOKIE_NAME = 'sprat_token';

// NFR2/NFR3: token lives only in an httpOnly cookie, never accessible to client-side JS.
function authenticate(req, res, next) {
  const token = req.cookies[COOKIE_NAME];
  if (!token) return next(new UnauthorizedError());

  let payload;
  try {
    payload = verifyToken(token);
  } catch (err) {
    return next(new UnauthorizedError('Session expired or invalid, please log in again.'));
  }

  const user = db
    .prepare('SELECT id, name, email, role, status, user_group_id FROM users WHERE id = ?')
    .get(payload.sub);

  if (!user || user.status !== 'active') {
    return next(new UnauthorizedError('Account is not active.'));
  }

  req.user = user;
  next();
}

// NFR1: server-side role-based authorization. Client-side route guarding is UX only.
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) return next(new UnauthorizedError());
    if (!allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError(`This action requires one of: ${allowedRoles.join(', ')}`));
    }
    next();
  };
}

module.exports = { authenticate, authorize, COOKIE_NAME };
