const asyncHandler = require('../utils/asyncHandler');
const usersService = require('../services/users');

// Sign-up/sign-in themselves happen client-side against Supabase Auth; this API
// only ever sees an already-issued access token (verified by `authenticate`).
const me = asyncHandler(async (req, res) => {
  res.json(req.user);
});

// Onboarding: a newly-signed-up (status='pending') account submits their name
// and requested role (never admin) for an admin to later approve or reject.
const submitOnboarding = asyncHandler(async (req, res) => {
  const profile = await usersService.submitOnboarding(req.user.id, req.body);
  res.json(profile);
});

module.exports = { me, submitOnboarding };
