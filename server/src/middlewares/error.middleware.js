function errorMiddleware(err, req, res, next) {
  if (err && err.code === 'P2002') {
    return res.status(409).json({ message: 'Email já cadastrado.' });
  }
  console.error(err);
  return res.status(500).json({ message: 'Erro interno no servidor.' });
}

module.exports = { errorMiddleware };
