// src/schemas/alumni.schemas.js
const { z } = require('zod');

const emptyToUndefined = (val) => {
  if (typeof val !== 'string') return val;
  const t = val.trim();
  return t === '' ? undefined : t;
};

const yearSchema = z.preprocess(
  (val) => {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') return parseInt(val, 10);
    return val;
  },
  z
    .number()
    .int()
    .min(1900)
    .max(new Date().getFullYear() + 10),
);

const birthDateSchema = z
  .string()
  .trim()
  .refine(
    (v) => /^\d{2}\/\d{2}\/\d{4}$/.test(v) || /^\d{4}-\d{2}-\d{2}/.test(v),
    'birthDate deve ser "DD/MM/AAAA" ou "AAAA-MM-DD"',
  );

const createAlumniSchema = z.object({
  fullName: z.string().trim().min(3, 'fullName obrigatório'),
  preferredName: z.preprocess(
    emptyToUndefined,
    z.string().trim().min(1).optional(),
  ),

  email: z.string().trim().toLowerCase().email('email inválido'),
  password: z.preprocess(emptyToUndefined, z.string().min(6).optional()),

  profilePicture: z.preprocess(emptyToUndefined, z.string().min(1).optional()),

  birthDate: birthDateSchema,

  course: z.string().trim().min(2, 'course obrigatório'),
  graduationYear: yearSchema,

  country: z.string().trim().min(2, 'country obrigatório'),
  state: z.preprocess(emptyToUndefined, z.string().trim().min(1).optional()),
  city: z.preprocess(emptyToUndefined, z.string().trim().min(1).optional()),

  addressComplement: z.preprocess(
    emptyToUndefined,
    z.string().trim().min(1).optional(),
  ),

  company: z.preprocess(emptyToUndefined, z.string().trim().min(1).optional()),
  role: z.preprocess(emptyToUndefined, z.string().trim().min(1).optional()),

  phone: z.string().trim().min(6, 'phone obrigatório'),
  linkedinUsername: z.preprocess(
    emptyToUndefined,
    z.string().trim().min(1).optional(),
  ),

  bio: z.preprocess(emptyToUndefined, z.string().trim().min(1).optional()),

  // aceita array (preferível) ou string JSON
  skills: z.union([z.array(z.string().min(1)), z.string().min(1)]).optional(),
});

const listAlumniQuerySchema = z.object({
  search: z.preprocess(emptyToUndefined, z.string().trim().min(1).optional()),
  country: z.preprocess(emptyToUndefined, z.string().trim().min(1).optional()),
  state: z.preprocess(emptyToUndefined, z.string().trim().min(1).optional()),
  city: z.preprocess(emptyToUndefined, z.string().trim().min(1).optional()),
  course: z.preprocess(emptyToUndefined, z.string().trim().min(1).optional()),
  graduationYear: z.preprocess((val) => {
    if (val === undefined) return undefined;
    const n = parseInt(String(val), 10);
    return Number.isNaN(n) ? undefined : n;
  }, z.number().int().optional()),

  page: z
    .preprocess((v) => parseInt(String(v ?? '1'), 10), z.number().int().min(1))
    .optional(),
  pageSize: z
    .preprocess(
      (v) => parseInt(String(v ?? '20'), 10),
      z.number().int().min(1).max(50),
    )
    .optional(),
});

module.exports = {
  createAlumniSchema,
  listAlumniQuerySchema,
};
