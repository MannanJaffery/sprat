const bcrypt = require('bcrypt');
const asyncHandler = require('../utils/asyncHandler');
const { signToken } = require('../utils/jwt');
const { UnauthorizedError, ForbiddenError } = require('../utils/errors');
const { COOKIE_NAME } = require('../middleware/auth');
const usersService = require('../services/users');

const isProd = process.env.NODE_ENV === 'production';

function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: isProd,
    maxAge: 8 * 60 * 60 * 1000,
  });
}

// NFR3: secure login — credentials checked against a bcrypt hash, token issued only in an
// httpOnly cookie, and this route is rate-limited (see routes/auth.js).
const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  const user = usersService.findByEmailWithPassword(email);

  if (!user) return next(new UnauthorizedError('Invalid email or password.'));
  if (user.status !== 'active') return next(new ForbiddenError('This account has been disabled.'));

  const matches = await bcrypt.compare(password, user.password_hash);
  if (!matches) return next(new UnauthorizedError('Invalid email or password.'));

  const token = signToken({ sub: user.id, role: user.role });
  setAuthCookie(res, token);

  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  });
});

const logout = asyncHandler(async (req, res) => {
  res.clearCookie(COOKIE_NAME);
  res.status(204).send();
});

const me = asyncHandler(async (req, res) => {
  res.json(req.user);
});

module.exports = { login, logout, me };
