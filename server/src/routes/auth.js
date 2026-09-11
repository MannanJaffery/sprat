const { Router } = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const authController = require('../controllers/authController');

const router = Router();

// Sign-up and sign-in happen client-side via Supabase Auth — there is nothing
// to do here except read the resulting session and let a new user finish
// onboarding.
router.get('/me', authenticate, authController.me);

router.patch(
  '/onboarding',
  authenticate,
  [
    body('name').trim().notEmpty().withMessage('Name is required.'),
    body('requestedRole')
      .isIn(['project_manager', 'analyst', 'guest'])
      .withMessage('Select a valid role.'),
  ],
  validate,
  authController.submitOnboarding
);

module.exports = router;
