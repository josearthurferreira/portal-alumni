// src/controllers/alumni.controller.js
const { prisma } = require('../database/prisma');

function parseBirthDate(input) {
  if (!input) return null;

  // ISO: 2000-01-20
  if (/^\d{4}-\d{2}-\d{2}/.test(input)) return new Date(input);

  // BR: 20/01/2000
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(input)) {
    const [dd, mm, yyyy] = input.split('/');
    return new Date(`${yyyy}-${mm}-${dd}`);
  }

  const d = new Date(input);
  return Number.isNaN(d.getTime()) ? null : d;
}

function safeParseJsonArray(str) {
  try {
    const v = JSON.parse(str);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

async function getAllAlumni(req, res, next) {
  try {
    const {
      search,
      country,
      state,
      city,
      course,
      graduationYear,
      page = 1,
      pageSize = 20,
    } = req.query;

    const take = Math.min(Math.max(parseInt(pageSize, 10) || 20, 1), 50);
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const skip = (pageNum - 1) * take;

    const where = {};
    if (country) where.country = String(country);
    if (state) where.state = String(state);
    if (city) where.city = String(city);
    if (course) where.course = String(course);
    if (graduationYear !== undefined) {
      const gy = parseInt(String(graduationYear), 10);
      if (!Number.isNaN(gy)) where.graduationYear = gy;
    }

    if (search) {
      const s = String(search);
      where.OR = [
        { fullName: { contains: s, mode: 'insensitive' } },
        { preferredName: { contains: s, mode: 'insensitive' } },
        { email: { contains: s, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.alumnus.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          fullName: true,
          preferredName: true,
          email: true,
          profilePicture: true,
          birthDate: true,
          course: true,
          graduationYear: true,
          country: true,
          state: true,
          city: true,
          addressComplement: true,
          company: true,
          role: true,
          phone: true,
          linkedinUsername: true,
          bio: true,
          skills: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.alumnus.count({ where }),
    ]);

    const normalized = items.map((a) => ({
      ...a,
      skills: a.skills ? safeParseJsonArray(a.skills) : [],
    }));

    return res.json({
      total,
      page: pageNum,
      pageSize: take,
      items: normalized,
    });
  } catch (err) {
    return next(err);
  }
}

async function createAlumni(req, res, next) {
  try {
    const body = req.body;

    const birthDate = parseBirthDate(body.birthDate);
    if (!birthDate)
      return res.status(400).json({ message: 'birthDate inválida' });

    // skills: aceita array ou string JSON e salva como string no SQLite
    const skillsStr = Array.isArray(body.skills)
      ? JSON.stringify(body.skills)
      : typeof body.skills === 'string'
      ? body.skills
      : null;

    const created = await prisma.alumnus.create({
      data: {
        fullName: body.fullName,
        preferredName: body.preferredName ?? null,

        email: body.email,
        password: body.password ?? null,

        profilePicture: body.profilePicture ?? null,

        birthDate,

        course: body.course,
        graduationYear: body.graduationYear,

        country: body.country,
        state: body.state ?? null,
        city: body.city ?? null,

        addressComplement: body.addressComplement ?? null,

        company: body.company ?? null,
        role: body.role ?? null,

        phone: body.phone,
        linkedinUsername: body.linkedinUsername ?? null,

        bio: body.bio ?? null,
        skills: skillsStr,
      },
      select: {
        id: true,
        fullName: true,
        preferredName: true,
        email: true,
        profilePicture: true,
        birthDate: true,
        course: true,
        graduationYear: true,
        country: true,
        state: true,
        city: true,
        addressComplement: true,
        company: true,
        role: true,
        phone: true,
        linkedinUsername: true,
        bio: true,
        skills: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(201).json({
      ...created,
      skills: created.skills ? safeParseJsonArray(created.skills) : [],
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = { getAllAlumni, createAlumni };
