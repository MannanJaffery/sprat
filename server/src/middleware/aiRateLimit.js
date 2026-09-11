// Every AI route calls out to a paid, external LLM provider, so each gets its
// own per-user rate limit — independent of any future general API rate limit.
const rateLimit = require('express-rate-limit');

const keyByUser = (req) => req.user?.id || req.ip;

// Conversational — allow a real back-and-forth.
const chatLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: keyByUser,
  message: { error: 'Too many assistant messages — please wait a bit before trying again.' },
});

// Heavier prompts (a project's full goal list) — tighter limit.
const analysisLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: keyByUser,
  message: { error: 'Too many AI analysis requests — please wait a bit before trying again.' },
});

module.exports = { chatLimiter, analysisLimiter };
