const { Router } = require('express');
const router = Router();

const authController = require('../controllers/auth.controller');
const {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require('../schemas/auth.schemas');
const { validateBody } = require('../middlewares/validate.middleware');

router.post('/register', validateBody(registerSchema), authController.register);
router.post('/login', validateBody(loginSchema), authController.login);

router.post('/verify-email', authController.verifyEmail);

router.post(
  '/forgot-password',
  validateBody(forgotPasswordSchema),
  authController.forgotPassword,
);

router.post(
  '/reset-password',
  validateBody(resetPasswordSchema),
  authController.resetPassword,
);

module.exports = router;
