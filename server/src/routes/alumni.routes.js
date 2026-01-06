// src/routes/alumni.routes.js
const { Router } = require('express');
const router = Router();

const {
  getAllAlumni,
  createAlumni,
} = require('../controllers/alumni.controller');
const {
  validateBody,
  validateQuery,
} = require('../middlewares/validate.middleware');
const {
  createAlumniSchema,
  listAlumniQuerySchema,
} = require('../schemas/alumni.schemas');

router.get('/', validateQuery(listAlumniQuerySchema), getAllAlumni);
router.post('/', validateBody(createAlumniSchema), createAlumni);

module.exports = router;
