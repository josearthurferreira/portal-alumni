const { Router } = require('express');
const router = Router();

const meController = require('../controllers/me.controller');
const { authRequired } = require('../middlewares/auth.middleware');
const { profileSchema } = require('../schemas/profile.schemas');
const { validateBody } = require('../middlewares/validate.middleware');

// Importe o multer e a configuração do cloudinary
const { storage } = require('../config/cloudinary');
const multer = require('multer');
const upload = multer({ storage });

// GET /me
router.get('/', authRequired, meController.me);

// GET /me/profile
router.get('/profile', authRequired, meController.getMyProfile);

// PUT /me/profile
// A ORDEM CORRETA É: auth -> upload (multer) -> validate (zod) -> controller
router.put(
  '/profile',
  authRequired,
  upload.single('profilePicture'), // 1º Processa a imagem e os campos de texto
  validateBody(profileSchema),     // 2º Valida o que o Multer processou
  meController.upsertProfile
);

module.exports = router;
