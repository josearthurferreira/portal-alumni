const { z } = require('zod');

const profileSchema = z.object({
  preferredName: z.string().optional().nullable(),

  // Coerce transforma a string ISO do form em objeto Date
  birthDate: z.coerce.date(),

  course: z.string().min(2),

  // Coerce transforma a string "2024" em number
  graduationYear: z.coerce
    .number()
    .int()
    .min(1950)
    .max(new Date().getFullYear() + 10),

  country: z.string().min(2),
  state: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  addressComp: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  yearsOfExperience: z.coerce.number().optional().nullable(),
  role: z.string().optional().nullable(),
  phone: z.string().min(10),
  linkedinUrl: z.string().url().optional().or(z.literal('')),
  bio: z.string().max(5000).optional().nullable(),

  // Transforma a string de skills (ex: "React,Node") em Array
  skills: z.preprocess((val) => {
    if (typeof val === 'string' && val.trim() === '') return [];
    if (typeof val === 'string') return val.split(',').map(s => s.trim());
    return val;
  }, z.array(z.string())).optional(),
}).passthrough();

module.exports = { profileSchema };
