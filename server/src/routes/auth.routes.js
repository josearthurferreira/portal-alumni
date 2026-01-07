const { Router } = require('express');
const router = Router();

const authController = require('../controllers/auth.controller');
const { registerSchema, loginSchema } = require('../schemas/auth.schemas');
const { validateBody } = require('../middlewares/validate.middleware');

router.post('/register', validateBody(registerSchema), authController.register);
router.post('/login', validateBody(loginSchema), authController.login);

module.exports = router;
