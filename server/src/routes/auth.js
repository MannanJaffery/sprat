const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const authController = require('../controllers/authController');

const router = Router();

// NFR3: throttle repeated login attempts to blunt credential-stuffing/brute force.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again later.' },
});

router.post(
  '/login',
  loginLimiter,
  [
    body('email').isEmail().withMessage('A valid email is required.'),
    body('password').isLength({ min: 1 }).withMessage('Password is required.'),
  ],
  validate,
  authController.login
);

router.post('/logout', authController.logout);
router.get('/me', authenticate, authController.me);

module.exports = router;
