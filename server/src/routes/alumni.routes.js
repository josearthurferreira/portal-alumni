const { Router } = require('express');
const multer = require('multer');
const storage = require('../config/cloudinary');
const upload = multer({ storage });

const router = Router();
const alumniController = require('../controllers/alumni.controller');
const { createAlumnusSchema, queryAlumnusSchema } = require('../schemas/alumni.schemas');
const { validateBody, validateQuery } = require('../middlewares/validate.middleware');

// 1. Mova a rota de filtros para o TOPO
router.get('/filters', alumniController.getFilterOptions);

// 2. Rota de listagem com validação de Query
router.get('/', validateQuery(queryAlumnusSchema), alumniController.listAlumni);

// 3. Cadastro
router.post(
  '/',
  upload.single('profilePicture'),
  validateBody(createAlumnusSchema),
  alumniController.createAlumnus
);

module.exports = router;
