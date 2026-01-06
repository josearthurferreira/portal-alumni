// src/middlewares/error.middleware.js
function errorMiddleware(err, req, res, next) {
  // Prisma unique constraint
  if (err && err.code === 'P2002') {
    return res
      .status(409)
      .json({ message: 'Já existe um aluno com esse email.' });
  }

  console.error(err);
  return res.status(500).json({ message: 'Erro interno no servidor.' });
}

module.exports = { errorMiddleware };
