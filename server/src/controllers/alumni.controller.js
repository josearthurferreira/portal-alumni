const prisma = require('../database/prisma');

// --- LISTAGEM ---
const listAlumni = async (req, res, next) => {
  try {
    // 1. Recebemos page e limit (com valores padrão para a página 1 e 8 itens)
    const { course, graduationYear, city, role, page = 1, limit = 8, fullName } = req.query;

    const where = {};
    if (course) where.course = course;
    if (graduationYear) where.graduationYear = Number(graduationYear);
    if (role) where.role = role;
    if (city) where.city = { contains: city, mode: 'insensitive' };

    if (fullName) where.fullName = { contains: String(fullName), mode: 'insensitive' };

    // 2. Calculamos quantos itens pular (skip) e quantos pegar (take)
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    // 3. Executamos a busca e a contagem simultaneamente (muito mais rápido)
    const [alumni, totalCount] = await Promise.all([
      prisma.alumnus.findMany({
        where,
        orderBy: [{ fullName: 'asc' }, { id: 'asc' }],
        skip,
        take,
      }),
      prisma.alumnus.count({ where }) // Conta o total de registros com esse filtro
    ]);

    // 4. Retornamos os dados junto com os metadados de paginação
    return res.status(200).json({
      data: alumni,
      meta: {
        total: totalCount,
        page: Number(page),
        limit: take,
        totalPages: Math.ceil(totalCount / take)
      }
    });
  } catch (error) {
    next(error);
  }
};

// server/src/controllers/alumni.controller.js

const getFilterOptions = async (req, res) => {
  try {
    const coursesData = await prisma.alumnus.findMany({
      select: { course: true },
      distinct: ['course'],
    });

    const yearsData = await prisma.alumnus.findMany({
      select: { graduationYear: true },
      distinct: ['graduationYear'],
    });

    res.json({
      courses: coursesData.map(c => c.course).filter(Boolean).sort(),
      years: yearsData.map(y => y.graduationYear).filter(Boolean).sort((a, b) => b - a),
      roles: []
    });
  } catch (error) {
    console.error("Erro no Prisma:", error);
    res.status(500).json({ error: "Erro interno no servidor" });
  }
};

// --- CADASTRO ---
const createAlumnus = async (req, res, next) => {
  try {
    // req.body já foi validado pelo middleware de validação
    const data = req.body;

    // Se houver arquivo, o Multer salvou no Cloudinary e colocou o link em req.file.path
    if (req.file) {
      data.profilePicture = req.file.path;
    }

    const newAlumnus = await prisma.alumnus.create({
      data: data, // Não precisa de ...data se data já for o objeto
    });

    return res.status(201).json(newAlumnus);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listAlumni,
  createAlumnus,
  getFilterOptions,
};
