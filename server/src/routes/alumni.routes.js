const { Router } = require('express');
const router = Router();

const alumniController = require('../controllers/alumni.controller');
const { createAlumnusSchema, queryAlumnusSchema } = require('../schemas/alumni.schemas');
const { validateBody, validateQuery } = require('../middlewares/validate.middleware');

// Rota de Listagem (JA)
router.get('/', validateQuery(queryAlumnusSchema), alumniController.listAlumni);

// Rota de Cadastro (TD)
router.post('/', validateBody(createAlumnusSchema), alumniController.createAlumnus);

module.exports = router;
