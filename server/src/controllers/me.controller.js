const prisma = require('../database/prisma');

function getUserModel() {
  return prisma.user || prisma.users;
}

function getAlumnusModel() {
  // normalmente é prisma.alumnus (model "Alumnus"), mas deixo fallback
  return prisma.alumnus || prisma.alumni;
}

async function me(req, res, next) {
  try {
    const User = getUserModel();

    // ✅ sem select (pra não quebrar com campo inexistente)
    const u = await User.findUnique({ where: { id: req.user.id } });

    if (!u) return res.status(404).json({ message: 'Usuário não encontrado.' });

    return res.status(200).json({
      id: u.id,
      email: u.email,
      fullName: u.fullName ?? u.full_name,
    });
  } catch (err) {
    next(err);
  }
}

async function upsertProfile(req, res, next) {
  try {
    const User = getUserModel();
    const Alumnus = getAlumnusModel();

    const u = await User.findUnique({ where: { id: req.user.id } });
    if (!u) return res.status(404).json({ message: 'Usuário não encontrado.' });

    const fullName = u.fullName ?? u.full_name;

    // payload vindo do front (AddAlumniModal)
    const data = req.body;

    // mapeia campos do front -> campos do model Alumnus (teu schema antigo)
    const mapped = {
      // mantém consistência com a conta (e evita quebrar colunas NOT NULL/unique antigas)
      fullName,
      email: u.email,

      preferredName: data.preferredName || null,
      phone: data.phone,
      birthDate: new Date(data.birthDate),

      country: data.country,
      state: data.state || null,
      city: data.city || null,
      addressComp: data.addressComplement || null,

      course: data.course,
      graduationYear: data.graduationYear,

      company: data.organization || null,
      role: data.role || null,
      yearsOfExperience: data.yearsOfExperience ?? null,

      linkedinUrl: data.linkedinUrl || null,
      bio: data.bio || null,
      skills: Array.isArray(data.skills) ? data.skills : [],
    };

    const tryUpsert = async (key) => {
      return Alumnus.upsert({
        where: { [key]: u.id },
        create: { [key]: u.id, ...mapped },
        update: mapped,
      });
    };

    let profile;
    try {
      // tenta com camelCase (se o Prisma tiver criado userId)
      profile = await tryUpsert('userId');
    } catch (e) {
      const msg = String(e?.message || '');
      // fallback pra snake_case (se o Prisma tiver criado user_id)
      if (msg.includes('Unknown argument') || msg.includes('Unknown arg')) {
        profile = await tryUpsert('user_id');
      } else {
        throw e;
      }
    }

    return res.status(200).json(profile);
  } catch (err) {
    next(err);
  }
}
async function getMyProfile(req, res, next) {
  try {
    const userId = req.userId || req.user?.id || req.user?.sub;

    let profile = null;

    // dependendo do nome do campo no Prisma, tenta userId ou user_id
    try {
      profile = await prisma.alumnus.findUnique({ where: { userId } });
    } catch (_) {}

    if (!profile) {
      try {
        profile = await prisma.alumnus.findUnique({
          where: { user_id: userId },
        });
      } catch (_) {}
    }

    if (!profile) {
      return res.status(404).json({ message: 'Perfil não encontrado.' });
    }

    return res.status(200).json(profile);
  } catch (err) {
    next(err);
  }
}
module.exports = { me, upsertProfile, getMyProfile };
