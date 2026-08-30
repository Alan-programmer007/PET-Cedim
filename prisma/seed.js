const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = 'petsdcedim@gmail.com';
  const plainPassword = '1234567cedim';

  // Verifica se o usuário já existe
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (!existingUser) {
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });
    console.log(`Usuário administrador criado com sucesso: ${user.email}`);
  } else {
    console.log(`Usuário administrador (${email}) já existe. Pulando criação.`);
  }
}

main()
  .catch((e) => {
    console.error('Erro ao executar o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
