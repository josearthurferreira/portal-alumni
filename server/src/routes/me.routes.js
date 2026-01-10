const { Router } = require('express');
const router = Router();

const meController = require('../controllers/me.controller');
const { authRequired } = require('../middlewares/auth.middleware');
const { profileSchema } = require('../schemas/profile.schemas');
const { validateBody } = require('../middlewares/validate.middleware');

// GET /me
router.get('/', authRequired, meController.me);

// GET /me/profile  (pra preencher o modal)
router.get('/profile', authRequired, meController.getMyProfile);

// PUT /me/profile  (cria/atualiza perfil do usuário logado)
router.put(
  '/profile',
  authRequired,
  validateBody(profileSchema),
  meController.upsertProfile,
);

module.exports = router;
