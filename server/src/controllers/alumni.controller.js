const prisma = require('../database/prisma');

/**
 * Controller responsável pela gestão de Alumni
 * JA (Ferreira): Foco em Listagem
 * TD (Domingos): Foco em Cadastro e Filtros
 */

// --- LISTAGEM (Tarefa do JA) ---
const listAlumni = async (req, res, next) => {
  try {
    // Pegamos os filtros validados da query (enviados pelo validateQuery no middleware)
    const { course, graduationYear, city } = req.query;

    const alumni = await prisma.alumnus.findMany({
      where: {
        // TD vai implementar a lógica detalhada de filtros aqui
        course: course,
        graduationYear: graduationYear,
        city: city,
      },
      orderBy: {
        fullName: 'asc',
      },
    });

    return res.status(200).json(alumni);
  } catch (error) {
    next(error); // Envia para o error.middleware.js do Miranda
  }
};

// --- CADASTRO (Tarefa do TD) ---
const createAlumnus = async (req, res, next) => {
  try {
    // Os dados já chegam validados pelo Zod através do middleware do Miranda
    const data = req.body;

    const newAlumnus = await prisma.alumnus.create({
      data: {
        ...data,
        // Caso queira tratar algum campo específico antes de salvar
      },
    });

    return res.status(201).json(newAlumnus);
  } catch (error) {
    next(error); // Envia para o error.middleware.js do Miranda
  }
};

module.exports = {
  listAlumni,
  createAlumnus,
};
