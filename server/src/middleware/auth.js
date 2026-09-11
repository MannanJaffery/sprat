const { createRemoteJWKSet, jwtVerify } = require('jose');
const { UnauthorizedError, ForbiddenError } = require('../utils/errors');
const db = require('../../db/connection');

const SUPABASE_URL = process.env.SUPABASE_URL;

if (!SUPABASE_URL) {
  throw new Error('SUPABASE_URL must be set in the environment.');
}

// Supabase signs access tokens with a per-project key (these days usually an
// asymmetric ES256 key, though older projects may still use a shared HS256
// secret) and publishes the corresponding public key(s) at this JWKS endpoint.
// `createRemoteJWKSet` fetches and caches them, matching by the token's `kid`,
// so verification keeps working across key rotation without any config here.
const JWKS = createRemoteJWKSet(new URL('/auth/v1/.well-known/jwks.json', SUPABASE_URL));

// Verifies the Supabase-issued access token sent as `Authorization: Bearer <token>`,
// then loads the matching profile (role/status) — the token itself only proves
// identity (its own `role` claim is Postgres's "authenticated"/"anon", not ours).
async function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next(new UnauthorizedError());

  let payload;
  try {
    ({ payload } = await jwtVerify(token, JWKS, {
      issuer: new URL('/auth/v1', SUPABASE_URL).toString(),
    }));
  } catch (err) {
    return next(new UnauthorizedError('Session expired or invalid, please log in again.'));
  }

  const profile = await db.queryOne(
    'SELECT id, name, email, role, status, user_group_id FROM profiles WHERE id = $1',
    [payload.sub]
  );

  if (!profile) return next(new UnauthorizedError('Account not found.'));
  if (profile.status === 'disabled') {
    return next(new UnauthorizedError('This account has been disabled.'));
  }

  // `status` may be 'pending' (no role yet — only /auth/me and /auth/onboarding
  // are reachable, since every other route's authorize() requires a real role)
  // or 'active'. Either way req.user is attached; business routes gate further.
  req.user = profile;
  next();
}

// Server-side role-based authorization. Client-side route guarding is UX only.
// Admins are always allowed, regardless of the specific roles a route lists —
// admins can do anything in this app.
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) return next(new UnauthorizedError());
    if (req.user.role === 'admin') return next();
    if (!allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError(`This action requires one of: ${allowedRoles.join(', ')}`));
    }
    next();
  };
}

module.exports = { authenticate, authorize };
