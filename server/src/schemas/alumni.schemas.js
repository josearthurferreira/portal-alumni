const { z } = require('zod');

// Schema para criação de um novo Aluno
const createAlumnusSchema = z.object({
  fullName: z.string({ required_error: "Nome completo é obrigatório" })
    .min(3, "O nome deve ter pelo menos 3 caracteres"),

  preferredName: z.string().optional(),

  email: z.string().email("Formato de e-mail inválido"),

  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres").optional(),

  phone: z.string().min(10, "Telefone deve conter DDD e número"),

  // O Zod transforma a string da requisição em um objeto Date do JS
  birthDate: z.string().datetime({ message: "Data de nascimento inválida (use ISO 8601)" })
    .or(z.string().transform((val) => new Date(val))),

  course: z.string().min(2, "Nome do curso é obrigatório"),

  graduationYear: z.number().int().min(1950).max(new Date().getFullYear() + 10),

  country: z.string().min(2, "País é obrigatório"),
  state: z.string().optional(),
  city: z.string().optional(),
  addressComp: z.string().optional(),

  company: z.string().optional(),
  role: z.string().optional(),
  linkedinUrl: z.string().url("URL do LinkedIn inválida").optional().or(z.literal('')),

  skills: z.string().optional(),
  bio: z.string().max(500, "A bio deve ter no máximo 500 caracteres").optional(),
});

// Schema para filtros de busca (usado pelo TD - Domingos)
const queryAlumnusSchema = z.object({
  course: z.string().optional(),
  graduationYear: z.string().transform(val => parseInt(val)).optional(),
  city: z.string().optional(),
});

module.exports = {
  createAlumnusSchema,
  queryAlumnusSchema
};
