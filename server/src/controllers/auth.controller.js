const prisma = require('../database/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const axios = require('axios'); // Para chamar a API em C#
const { z } = require('zod');

const registerSchema = z.object({
  fullName: z.string().min(3, "Nome muito curto"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres")
});
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
    const { fullName, email, password } = registerSchema.parse(req.body);

    // 1. Verificar se o usuário já existe na tabela definitiva
    const existing = await prisma.users.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ message: "Usuário já cadastrado." });

    // 2. Preparar dados
    const passwordHash = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex'); // Token para o link
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h de validade

    // 3. Salvar na pending_users (usamos upsert para o caso de ele tentar registrar 2x antes de confirmar)
    await prisma.pending_users.upsert({
      where: { email },
      update: { 
        full_name: fullName, 
        password_hash: passwordHash, 
        code_hash: verificationToken, // Usando o campo code_hash para o token do link
        expires_at: expiresAt 
      },
      create: {
        full_name: fullName,

    const created = await User.create({
      data: {
        [fields.fullName]: fullName,
        [fields.passwordHash]: passwordHash,
        email,
        password_hash: passwordHash,
        code_hash: verificationToken,
        expires_at: expiresAt
      }
    });

    // 4. Chamar API C# para enviar o e-mail
    // O link será: https://seu-site.com/verify?token=XYZ&email=abc@email.com
    const verificationLink = `${process.env.FRONTEND_URL}/verify?token=${verificationToken}&email=${email}`;
    
    await axios.post(process.env.CSHARP_EMAIL_SERVICE_URL, {
      email,
      fullName,
      link: verificationLink
    });

    return res.status(201).json({ message: "Link de confirmação enviado para o e-mail." });
  } catch (err) {
    next(err);
  }
}

async function verifyEmail(req, res, next) {
  try {
    const { email, token } = req.body;

    // 1. Buscar registro pendente
    const pending = await prisma.pending_users.findUnique({ where: { email } });

    if (!pending || pending.code_hash !== token) {
      return res.status(400).json({ message: "Token inválido ou e-mail incorreto." });
    }

    if (new Date() > pending.expires_at) {
      return res.status(400).json({ message: "Este link expirou." });
    }

    // 2. Transação: Mover para a tabela definitiva e apagar da pendente
    await prisma.$transaction(async (tx) => {
      await tx.users.create({
        data: {
          full_name: pending.full_name,
          email: pending.email,
          password_hash: pending.password_hash,
          email_verified: true
        }
      });

      await tx.pending_users.delete({ where: { email } });
    });

    return res.status(200).json({ message: "E-mail confirmado com sucesso! Você já pode fazer login." });
  } catch (err) {
    if (err?.code === 'P2002') {
      return res
        .status(409)
        .json({ message: 'Este e-mail já está cadastrado.' });
    }
    next(err);
  }
}

async function verifyEmail(req, res, next) {
  try {
    const { email, token } = req.body;

    // 1. Buscar registro pendente
    const pending = await prisma.pending_users.findUnique({ where: { email } });

    if (!pending || pending.code_hash !== token) {
      return res.status(400).json({ message: "Token inválido ou e-mail incorreto." });
    }

    if (new Date() > pending.expires_at) {
      return res.status(400).json({ message: "Este link expirou." });
    }

    // 2. Transação: Mover para a tabela definitiva e apagar da pendente
    await prisma.$transaction(async (tx) => {
      await tx.users.create({
        data: {
          full_name: pending.full_name,
          email: pending.email,
          password_hash: pending.password_hash,
          email_verified: true
        }
      });

      await tx.pending_users.delete({ where: { email } });
    });

    return res.status(200).json({ message: "E-mail confirmado com sucesso! Você já pode fazer login." });
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
    const found = await prisma.users.findUnique({ where: { email } });

    if (!found) return res.status(401).json({ message: 'Credenciais inválidas ou e-mail não confirmado.' });
    const found = await User.findUnique({ where: { email } });

    if (!found) {
      return res.status(401).json({ message: 'Credenciais inválidas.' });
    }

    const ok = await bcrypt.compare(password, found.password_hash);
    if (!ok) return res.status(401).json({ message: 'Credenciais inválidas.' });
    const hash = found[fields.passwordHash];
    const ok = await bcrypt.compare(password, hash);

    if (!ok) {
      return res.status(401).json({ message: 'Credenciais inválidas.' });
    }

    const token = jwt.sign({ sub: found.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });

    return res.status(200).json({ token, user: { id: found.id, email: found.email, fullName: found.full_name } });
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

module.exports = { register, verifyEmail, login };
module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
};
