const { Router } = require('express');
const router = Router();

const meController = require('../controllers/me.controller');
const { profileSchema } = require('../schemas/profile.schemas');
const { validateBody } = require('../middlewares/validate.middleware');
const { authRequired } = require('../middlewares/auth.middleware.js');
router.get('/', authRequired, meController.me);
router.put(
  '/profile',
  authRequired,
  validateBody(profileSchema),
  meController.upsertProfile,
);

module.exports = router;
