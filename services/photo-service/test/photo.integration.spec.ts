import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppModule } from '../src/app.module';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';
import { PrismaService } from '../src/prisma.service';
import { CloudinaryService } from '../src/photo/cloudinary.service';
import { UsersClientService } from '../src/photo/users-client.service';

describe('Photo service integration', () => {
  let app: INestApplication;

  const prismaMock = {
    photo: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
    comment: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
  };

  const cloudinaryMock = {
    uploadImage: vi.fn(),
    deleteImage: vi.fn(),
    buildThumbnailUrl: vi.fn(),
  };

  const usersClientMock = {
    getUploaderSummary: vi.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .overrideProvider(CloudinaryService)
      .useValue(cloudinaryMock)
      .overrideProvider(UsersClientService)
      .useValue(usersClientMock)
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: { switchToHttp: () => { getRequest: () => Record<string, unknown> } }) => {
          const requestObj = context.switchToHttp().getRequest();
          requestObj.user = {
            sub: '11111111-1111-1111-1111-111111111111',
            email: 'demo@qode.world',
            role: 'USER',
          };
          return true;
        },
      })
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('POST /photos uploads and stores metadata', async () => {
    cloudinaryMock.uploadImage.mockResolvedValue({
      publicId: 'photos/demo-1',
      secureUrl: 'https://cdn.example.com/demo-1.jpg',
      format: 'jpg',
      bytes: 1024,
      width: 800,
      height: 600,
    });
    prismaMock.photo.create.mockResolvedValue({
      id: '97b1fa07-8e4c-4a63-acd9-25110fec8397',
      userId: '11111111-1111-1111-1111-111111111111',
      publicId: 'photos/demo-1',
      secureUrl: 'https://cdn.example.com/demo-1.jpg',
      format: 'jpg',
      bytes: 1024,
      width: 800,
      height: 600,
      createdAt: new Date().toISOString(),
    });
    cloudinaryMock.buildThumbnailUrl.mockReturnValue('https://cdn.example.com/thumb.jpg');

    const response = await request(app.getHttpServer())
      .post('/photos')
      .attach('file', Buffer.from('binary-image'), {
        filename: 'demo.jpg',
        contentType: 'image/jpeg',
      })
      .expect(201);

    expect(response.body.publicId).toBe('photos/demo-1');
    expect(response.body.thumbnailUrl).toBe('https://cdn.example.com/thumb.jpg');
    expect(prismaMock.photo.create).toHaveBeenCalledTimes(1);
  });

  it('POST /photos/:photoId/comments creates comment and GET lists comments', async () => {
    const photoId = '4f1aa2ec-c48f-44e0-bb25-7e2cfa1e7f81';
    prismaMock.photo.findUnique.mockResolvedValue({ id: photoId });
    prismaMock.comment.create.mockResolvedValue({
      id: 'f26c44f2-5fdf-4a4d-9c58-80ae1cec8347',
      photoId,
      userId: '11111111-1111-1111-1111-111111111111',
      content: '<hello>',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const createResponse = await request(app.getHttpServer())
      .post(`/photos/${photoId}/comments`)
      .send({ content: '  <hello>  ' })
      .expect(201);

    expect(createResponse.body.content).toBe('hello');

    prismaMock.comment.findMany.mockResolvedValue([
      {
        id: 'f26c44f2-5fdf-4a4d-9c58-80ae1cec8347',
        photoId,
        userId: '11111111-1111-1111-1111-111111111111',
        content: '<hello>',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);
    prismaMock.comment.count.mockResolvedValue(1);

    const listResponse = await request(app.getHttpServer())
      .get(`/photos/${photoId}/comments?page=1&pageSize=10`)
      .expect(200);

    expect(listResponse.body.total).toBe(1);
    expect(listResponse.body.items[0].content).toBe('hello');
  });
});
