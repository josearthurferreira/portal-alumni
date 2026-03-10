const { PrismaClient } = require('@prisma/client');
const { faker } = require('@faker-js/faker');

const prisma = new PrismaClient();

async function main() {
  console.log('--- 🧹 Limpando banco de dados ---');
  await prisma.alumnus.deleteMany();

  console.log('🚀 Iniciando o Stress Test: Preparando 6.000 Ex-Alunos...');

  const totalUsers = 6000;
  const batchSize = 1000; // Lotes de 1000 para não sobrecarregar o banco
  // Hash genérico da senha "123456" para todos
  const defaultPasswordHash = '$2b$10$EP03m245oZpI0h/5Y4.8Z.u2oO3tA2g1mUvO.wF/L6h5lZ2z2D/Kq';

  for (let batch = 0; batch < totalUsers / batchSize; batch++) {
    const usersBatch = [];
    const alumniBatch = [];

    for (let i = 0; i < batchSize; i++) {
      const userId = faker.string.uuid();
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const fullName = `${firstName} ${lastName}`;
      // Garante um email 100% único usando o índice
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${batch * batchSize + i}@alumni.teste.com`;

      usersBatch.push({
        id: userId,
        full_name: fullName,
        email: email,
        password_hash: defaultPasswordHash,
      });

      alumniBatch.push({
        id: faker.string.uuid(),
        user_id: userId,
        fullName: fullName,
        email: email,
        phone: faker.phone.number(),
        birthDate: faker.date.birthdate({ min: 22, max: 65, mode: 'age' }),
        country: 'Brasil',
        state: faker.location.state(),
        city: faker.location.city(),
        course: faker.helpers.arrayElement(['Engenharia Cartográfica', 'Engenharia da Computação', 'Engenharia de Comunicações', 'Engenharia de Fortificação e Construção', 'Engenharia de Materiais', 'Engenharia Elétrica', 'Engenharia Eletrônica', 'Engenharia Mecânica e de Automóveis', 'Engenharia Mecânica e de Armamentos', 'Engenharia Química']),
        graduationYear: faker.number.int({ min: 1980, max: 2024 }),
        company: faker.company.name(),
        role: faker.person.jobTitle(),
        bio: faker.lorem.paragraph(),
        skills: faker.helpers.arrayElements(['React', 'Node.js', 'Python', 'Java', 'Docker', 'PostgreSQL', 'AWS', 'TypeScript'], 3),
        profilePicture: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random`
      });
    }

    // Salva os 1.000 usuários e os 1.000 ex-alunos ao mesmo tempo
    await prisma.$transaction([
      prisma.users.createMany({ data: usersBatch }),
      prisma.alumnus.createMany({ data: alumniBatch })
    ]);

    console.log(`✅ Lote ${batch + 1} concluído: ${(batch + 1) * batchSize} usuários criados...`);
  }

  console.log('🎉 Fim! O banco de dados acaba de receber 6.000 usuários com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante a injeção de dados:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
