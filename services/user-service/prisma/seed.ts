import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient, UserRole } from '../src/generated/prisma';

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ??
    'postgresql://postgres:postgres@localhost:5432/qode_photo?schema=user_domain',
});

const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  const user = await prisma.user.upsert({
    where: { email: 'demo.user@qode.world' },
    update: {},
    create: {
      email: 'demo.user@qode.world',
      name: 'Demo User',
      avatarUrl: 'https://placehold.co/128x128/png',
      role: UserRole.USER,
    },
  });

  await prisma.oAuthIdentity.upsert({
    where: {
      provider_providerUserId: {
        provider: 'google',
        providerUserId: 'demo-google-user-id',
      },
    },
    update: {},
    create: {
      provider: 'google',
      providerUserId: 'demo-google-user-id',
      userId: user.id,
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
