const prisma = require('../database/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

function getUserModel() {
  // fallback caso o Prisma tenha gerado "users" em vez de "user"
  return prisma.user || prisma.users;
}

function toPublicUser(u) {
  if (!u) return null;
  // dependendo do schema gerado, pode ser fullName ou full_name etc.
  return {
    id: u.id,
    fullName: u.fullName ?? u.full_name,
    email: u.email,
  };
}

async function register(req, res, next) {
  try {
    const User = getUserModel();
    const { fullName, email, password } = req.body;

    const passwordHash = await bcrypt.hash(password, 10);

    const created = await User.create({
      data: {
        // suporta ambos os nomes, dependendo do schema
        ...(User === prisma.user
          ? { fullName, passwordHash }
          : { full_name: fullName, password_hash: passwordHash }),
        email,
      },
    });

    return res.status(201).json({ user: toPublicUser(created) });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const User = getUserModel();
    const { email, password } = req.body;

    const found = await User.findUnique({ where: { email } });
    if (!found)
      return res.status(401).json({ message: 'Credenciais inválidas.' });

    const hash = found.passwordHash ?? found.password_hash;
    const ok = await bcrypt.compare(password, hash);
    if (!ok) return res.status(401).json({ message: 'Credenciais inválidas.' });

    const token = jwt.sign({ sub: found.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });

    return res.status(200).json({ token, user: toPublicUser(found) });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login };
