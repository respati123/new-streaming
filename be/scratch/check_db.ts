import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const donations = await prisma.donation.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
  });
  console.log(JSON.stringify(donations, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
