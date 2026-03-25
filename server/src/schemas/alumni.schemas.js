const { z } = require('zod');

// Schema para criação de um novo Aluno
const createAlumnusSchema = z.object({
  // Campo para a URL da imagem processada pelo Multer/Cloudinary
  profilePicture: z.string().optional().nullable(),

  fullName: z.string({ required_error: "Nome completo é obrigatório" })
    .min(3, "O nome deve ter pelo menos 3 caracteres"),

  preferredName: z.string().optional().nullable(),

  email: z.string().email("Formato de e-mail inválido"),

  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres").optional(),

  phone: z.string().min(10, "Telefone deve conter DDD e número"),

  // Coerce converte a string do FormData para objeto Date do JS
  birthDate: z.coerce.date({
    errorMap: () => ({ message: "Data de nascimento inválida" })
  }),

  // Campo course (estava faltando no seu schema anterior)
  course: z.string({ required_error: "O curso é obrigatório" }).min(2, "Nome do curso é obrigatório"),

  // Coerce converte "2024" (string) para 2024 (number)
  graduationYear: z.coerce.number().int().min(1950).max(new Date().getFullYear() + 10),

  country: z.string().min(2, "País é obrigatório"),
  state: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  addressComp: z.string().optional().nullable(),

  company: z.string().optional().nullable(),

  yearsOfExperience: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? null : val),
    z.coerce.number().int().min(0).nullable().optional()
  ),

  role: z.string().optional().nullable(),

  // Permite URL válida ou string vazia
  linkedinUrl: z.string().url("URL do LinkedIn inválida").optional().or(z.literal('')),

  // Chega do Front como uma string separada por vírgula
  skills: z.string().optional().nullable(),

  bio: z.string().max(500, "A bio deve ter no máximo 500 caracteres").optional().nullable(),
});

// Schema para filtros de busca (usado pelo TD - Domingos)
const queryAlumnusSchema = z.object({
  course: z.string().optional(),
  graduationYear: z.coerce.number().optional(), // Ajustado para aceitar número via query string
  city: z.string().optional(),
  role: z.string().optional(),
  fullName: z.string().optional(),

  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(8)
});

module.exports = {
  createAlumnusSchema,
  queryAlumnusSchema
};
