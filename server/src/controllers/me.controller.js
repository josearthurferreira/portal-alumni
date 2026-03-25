const prisma = require('../database/prisma');
const { cloudinary } = require('../config/cloudinary');

function getUserModel() {
  return prisma.user || prisma.users;
}

function getAlumnusModel() {
  return prisma.alumnus || prisma.alumni;
}

async function me(req, res, next) {
  try {
    const User = getUserModel();
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

// --- FUNÇÃO ADICIONADA: Extrai o public_id do Cloudinary pela URL ---
function getCloudinaryPublicId(url) {
  if (!url) return null;
  try {
    const parts = url.split('/upload/');
    if (parts.length !== 2) return null;
    let path = parts[1];
    path = path.replace(/^v\d+\//, ''); // Remove versão (ex: v1612345678/) se existir
    const publicId = path.substring(0, path.lastIndexOf('.'));
    return publicId;
  } catch (err) {
    console.error("Erro ao extrair public_id:", err);
    return null;
  }
}

async function upsertProfile(req, res, next) {
  try {
    const User = getUserModel();
    const Alumnus = getAlumnusModel();

    const u = await User.findUnique({ where: { id: req.user.id } });
    if (!u) return res.status(404).json({ message: 'Usuário não encontrado.' });

    // --- NOVIDADE 1: Busca o perfil atual para sabermos a foto antiga ---
    let existingProfile = null;
    try {
      existingProfile = await Alumnus.findUnique({ where: { userId: u.id } });
    } catch (e) {
      try { existingProfile = await Alumnus.findUnique({ where: { user_id: u.id } }); } catch (e) {}
    }

    // --- NOVIDADE 2: Função para apagar imagem do Cloudinary ---
    const deleteOldPhoto = async (url) => {
      if (!url || !url.includes('cloudinary.com')) return;
      try {
        // Extrai o public_id da URL (Ex: https://res.cloudinary.com/.../upload/v123/folder/file.jpg -> folder/file)
        const parts = url.split('/upload/');
        if (parts.length < 2) return;
        let pathParts = parts[1].split('/');
        if (pathParts[0].startsWith('v')) pathParts.shift(); // Remove a versão (v123456...)
        const publicId = pathParts.join('/').split('.')[0]; // Remove a extensão (.jpg, .png)
        await cloudinary.uploader.destroy(publicId);
      } catch (err) {
        console.error('Erro silencioso: Não foi possível deletar a imagem antiga no Cloudinary:', err);
      }
    };

    const fullName = u.fullName ?? u.full_name;
    const data = req.body;

    let profilePictureUrl = undefined;

    // CASO 1: Usuário enviou uma nova foto
    if (req.file) {
      try {
        const b64 = Buffer.from(req.file.buffer).toString('base64');
        const dataURI = "data:" + req.file.mimetype + ";base64," + b64;

        const result = await cloudinary.uploader.upload(dataURI, {
          folder: 'alumni_profiles',
          resource_type: 'auto',
        });

        profilePictureUrl = result.secure_url;

        // Se o upload da nova deu certo, apaga a antiga do Cloudinary
        if (existingProfile && existingProfile.profilePicture) {
          await deleteOldPhoto(existingProfile.profilePicture);
        }
      } catch (uploadError) {
        throw new Error('Falha ao processar a imagem do perfil.');
      }
    }
    // CASO 2: Usuário pediu para remover a foto (e não enviou uma nova)
    else if (data.removePhoto === 'true' || data.removePhoto === true) {
      profilePictureUrl = null;

      // Apaga a foto do Cloudinary
      if (existingProfile && existingProfile.profilePicture) {
        await deleteOldPhoto(existingProfile.profilePicture);
      }
    }

    // mapeia campos do front -> campos do model Alumnus
    const mapped = {
      fullName,
      email: u.email,
      preferredName: data.preferredName || null,
      phone: data.phone,
      birthDate: data.birthDate ? new Date(data.birthDate) : undefined,

      country: data.country,
      state: data.state || null,
      city: data.city || null,
      addressComp: data.addressComplement || null,

      course: data.course,
      graduationYear: data.graduationYear,

      company: data.company || null,
      role: data.role || null,
      yearsOfExperience: data.yearsOfExperience ?? null,

      linkedinUrl: data.linkedinUrl || null,
      bio: data.bio || null,
      skills: Array.isArray(data.skills) ? data.skills : [],

      ...(profilePictureUrl !== undefined && { profilePicture: profilePictureUrl }),
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
      profile = await tryUpsert('userId');
    } catch (e) {
      const msg = String(e?.message || '');
      if (msg.includes('Unknown argument') || msg.includes('Unknown arg')) {
        profile = await tryUpsert('user_id');
      } else {
        throw e;
      }
    }

    return res.status(200).json({
      ...profile,
      company: profile.company ?? profile.company ?? null,
      addressComplement:
        profile.addressComp ?? profile.addressComplement ?? null,
    });
  } catch (err) {
    next(err);
  }
}

async function getMyProfile(req, res, next) {
  try {
    const userId = req.userId || req.user?.id || req.user?.sub;
    let profile = null;

    try {
      profile = await prisma.alumnus.findUnique({ where: { userId } });
    } catch (_) { }

    if (!profile) {
      try {
        profile = await prisma.alumnus.findUnique({
          where: { user_id: userId },
        });
      } catch (_) { }
    }

    if (!profile) {
      return res.status(404).json({ message: 'Perfil não encontrado.' });
    }

    return res.status(200).json({
      ...profile,
      company: profile.company ?? profile.company ?? null,
      addressComplement:
        profile.addressComp ?? profile.addressComplement ?? null,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { me, upsertProfile, getMyProfile };
