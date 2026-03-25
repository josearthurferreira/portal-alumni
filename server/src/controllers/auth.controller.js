const prisma = require('../database/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendPasswordResetEmail } = require('../services/emailService');

function getUserModel() {
  return prisma.user || prisma.users;
}

function isCamelCaseModel(User) {
  return User === prisma.user;
}

function getFieldNames(User) {
  if (isCamelCaseModel(User)) {
    return {
      fullName: 'fullName',
      passwordHash: 'passwordHash',
      resetToken: 'resetPasswordToken',
      resetExpires: 'resetPasswordExpires',
    };
  }

  return {
    fullName: 'full_name',
    passwordHash: 'password_hash',
    resetToken: 'reset_password_token',
    resetExpires: 'reset_password_expires',
  };
}

function toPublicUser(u) {
  if (!u) return null;

  return {
    id: u.id,
    fullName: u.fullName ?? u.full_name,
    email: u.email,
  };
}

async function register(req, res, next) {
  try {
    const User = getUserModel();
    const fields = getFieldNames(User);

    const { fullName, email, password } = req.body;

    const passwordHash = await bcrypt.hash(password, 10);

    const created = await User.create({
      data: {
        [fields.fullName]: fullName,
        [fields.passwordHash]: passwordHash,
        email,
      },
    });

    return res.status(201).json({ user: toPublicUser(created) });
  } catch (err) {
    if (err?.code === 'P2002') {
      return res
        .status(409)
        .json({ message: 'Este e-mail já está cadastrado.' });
    }
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const User = getUserModel();
    const fields = getFieldNames(User);

    const { email, password } = req.body;

    const found = await User.findUnique({ where: { email } });

    if (!found) {
      return res.status(401).json({ message: 'Credenciais inválidas.' });
    }

    const hash = found[fields.passwordHash];
    const ok = await bcrypt.compare(password, hash);

    if (!ok) {
      return res.status(401).json({ message: 'Credenciais inválidas.' });
    }

    const token = jwt.sign({ sub: found.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });

    return res.status(200).json({
      token,
      user: toPublicUser(found),
    });
  } catch (err) {
    next(err);
  }
}

async function forgotPassword(req, res, next) {
  try {
    const User = getUserModel();
    const fields = getFieldNames(User);

    const { email } = req.body;

    const found = await User.findUnique({
      where: { email },
    });

    // resposta genérica para não expor se o e-mail existe ou não
    const genericResponse = {
      message:
        'Se o e-mail existir no sistema, as instruções de recuperação foram enviadas.',
    };

    if (!found) {
      return res.status(200).json(genericResponse);
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await User.update({
      where: { id: found.id },
      data: {
        [fields.resetToken]: token,
        [fields.resetExpires]: expiresAt,
      },
    });

    const userName = found[fields.fullName] || 'usuário';

    await sendPasswordResetEmail(found.email, userName, token);

    return res.status(200).json(genericResponse);
  } catch (err) {
    next(err);
  }
}

async function resetPassword(req, res, next) {
  try {
    const User = getUserModel();
    const fields = getFieldNames(User);

    const { token, password } = req.body;

    const found = await User.findFirst({
      where: {
        [fields.resetToken]: token,
        [fields.resetExpires]: {
          gt: new Date(),
        },
      },
    });

    if (!found) {
      return res.status(400).json({
        message: 'Token inválido ou expirado.',
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await User.update({
      where: { id: found.id },
      data: {
        [fields.passwordHash]: passwordHash,
        [fields.resetToken]: null,
        [fields.resetExpires]: null,
      },
    });

    return res.status(200).json({
      message: 'Senha redefinida com sucesso.',
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
};
