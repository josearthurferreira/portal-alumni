const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- 🧹 Limpando banco de dados ---');
  await prisma.alumnus.deleteMany(); // Apaga tudo para não duplicar

  console.log('--- 🌱 Semeando novos dados ---');

  await prisma.alumnus.createMany({
    data: [
      {
        fullName: "José Arthur Ferreira",
        email: "jose.arthur@exemplo.com",
        phone: "86999999999",
        birthDate: new Date("2000-01-01T00:00:00.000Z"),
        course: "Engenharia de Computação",
        graduationYear: 2023,
        city: "Teresina",
        state: "PI",
        country: "Brasil", // Adicione esta linha aqui
        role: "Arquiteto de Software",
        company: "IME Júnior",
        yearsOfExperience: 3,
        bio: "Arquiteto inicial do sistema Alumni. Entusiasta de arquitetura escalável e Node.js.",
        skills: ["React", "Node.js", "Prisma", "PostgreSQL"]
      },
      {
        fullName: "Thiago Domingos",
        email: "thiago.d@exemplo.com",
        phone: "86988888888",
        birthDate: new Date("1999-05-15T00:00:00.000Z"),
        course: "Engenharia de Computação",
        graduationYear: 2022,
        city: "Teresina",
        state: "PI",
        country: "Brasil", // E esta linha aqui também
        role: "Desenvolvedor Fullstack",
        company: "Tech Solutions",
        yearsOfExperience: 4,
        bio: "Desenvolvedor focado em soluções robustas para o ecossistema web.",
        skills: ["JavaScript", "Express", "SQL", "Zod"]
      }
    ]
  });

  console.log('✅ Banco de dados atualizado com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
