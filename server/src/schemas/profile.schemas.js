const { z } = require('zod');

const profileSchema = z
  .object({
    preferredName: z.string().optional(),
    birthDate: z.string().datetime(),
    course: z.string().min(2),
    graduationYear: z
      .number()
      .int()
      .min(1950)
      .max(new Date().getFullYear() + 10),

    country: z.string().min(2),
    state: z.string().nullable().optional(),
    city: z.string().nullable().optional(),

    addressComplement: z.string().optional(),

    organization: z.string().optional(),
    role: z.string().optional(),

    phone: z.string().min(10),

    linkedinUrl: z.string().url().optional().or(z.literal('')),
    bio: z.string().max(500).optional(),
    skills: z.array(z.string()).optional(),
  })
  .passthrough(); // deixa passar fullName/email/photoFile sem quebrar

module.exports = { profileSchema };
