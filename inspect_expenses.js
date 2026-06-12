const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const userId = 'cmq8bof9r0000vlxod7i3f7q6'; // diogenesviana10@gmail.com

  console.log('--- PESSOAS ---');
  const people = await prisma.person.findMany({ where: { userId } });
  people.forEach(p => {
    console.log(`ID: ${p.id} | Nome: ${p.name}`);
  });

  console.log('--- DISTRIBUIÇÃO DE MESES DE EXPENSES ---');
  const months = await prisma.expense.groupBy({
    by: ['month'],
    where: { userId },
    _count: { id: true }
  });
  console.log(months);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
