import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { beforeAll, afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma.service';
import { JwtService } from '@nestjs/jwt';

describe('User service integration', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  const prismaMock = {
    user: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
    },
    oAuthIdentity: {
      upsert: vi.fn(),
    },
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
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

    jwtService = moduleRef.get(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('POST /internal/users/sync-oauth returns token and normalized profile', async () => {
    prismaMock.user.upsert.mockResolvedValue({
      id: '1ba95db3-a8d7-4605-b274-47cae9e6c00d',
      email: 'demo@qode.world',
      name: 'Demo User',
      avatarUrl: 'https://example.com/avatar.png',
      role: 'USER',
    });
    prismaMock.oAuthIdentity.upsert.mockResolvedValue({ id: 'identity-1' });

    const response = await request(app.getHttpServer())
      .post('/internal/users/sync-oauth')
      .send({
        provider: 'google',
        providerUserId: 'google-1',
        email: 'demo@qode.world',
        name: 'Demo User',
        avatarUrl: 'https://example.com/avatar.png',
      })
      .expect(201);

    expect(response.body.accessToken).toEqual(expect.any(String));
    expect(response.body.user).toEqual({
      id: '1ba95db3-a8d7-4605-b274-47cae9e6c00d',
      email: 'demo@qode.world',
      name: 'Demo User',
      avatarUrl: 'https://example.com/avatar.png',
      role: 'USER',
    });
  });

  it('POST /internal/users/sync-oauth rejects invalid email', async () => {
    await request(app.getHttpServer())
      .post('/internal/users/sync-oauth')
      .send({
        provider: 'google',
        providerUserId: 'google-1',
        email: 'invalid-email',
      })
      .expect(400);
  });

  it('GET /users/me requires auth and returns current user', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: '4f3f53ab-22dd-4c7a-96aa-77290249303f',
      email: 'me@qode.world',
      name: 'Current User',
      avatarUrl: null,
      role: 'USER',
    });

    const token = await jwtService.signAsync({
      sub: '4f3f53ab-22dd-4c7a-96aa-77290249303f',
      email: 'me@qode.world',
      role: 'USER',
    });

    const response = await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toEqual({
      id: '4f3f53ab-22dd-4c7a-96aa-77290249303f',
      email: 'me@qode.world',
      name: 'Current User',
      avatarUrl: null,
      role: 'USER',
    });
  });
});
