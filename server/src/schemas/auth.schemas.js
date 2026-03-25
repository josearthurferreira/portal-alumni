const { z } = require('zod');

const registerSchema = z.object({
  fullName: z
    .string()
    .min(3, 'O nome completo deve ter pelo menos 3 caracteres.'),
  email: z.string().email('Digite um e-mail válido.'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres.'),
});

const loginSchema = z.object({
  email: z.string().email('Digite um e-mail válido.'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres.'),
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Digite um e-mail válido.'),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token obrigatório.'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres.'),
});

module.exports = {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
};
