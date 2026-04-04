import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '../src/generated/prisma';

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ??
    'postgresql://postgres:postgres@localhost:5432/qode_photo?schema=photo_domain',
});

const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  const photo = await prisma.photo.upsert({
    where: { id: 'demo-photo-id' },
    update: {},
    create: {
      id: 'demo-photo-id',
      userId: 'demo-user-id',
      publicId: 'demo/public-id',
      secureUrl: 'https://placehold.co/1200x900/png',
      format: 'png',
      bytes: 12345,
      width: 1200,
      height: 900,
    },
  });

  await prisma.comment.upsert({
    where: { id: 'demo-comment-id' },
    update: {},
    create: {
      id: 'demo-comment-id',
      photoId: photo.id,
      userId: 'demo-user-id',
      content: 'First demo comment',
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
