import { JwtService } from '@nestjs/jwt';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../prisma.service';
import { AuthService } from './auth.service';
import { OAuthProvider } from './google-auth.dto';

describe('AuthService unit', () => {
  const prismaMock = {
    user: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
    },
    oAuthIdentity: {
      upsert: vi.fn(),
    },
  } as unknown as PrismaService;

  const jwtServiceMock = {
    signAsync: vi.fn(),
  } as unknown as JwtService;

  let service: AuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AuthService(prismaMock, jwtServiceMock);
  });

  it('upserts user + oauth identity and returns internal token payload', async () => {
    (prismaMock.user.upsert as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'd0f3f5a0-e304-4e49-b782-3ae9ed413513',
      email: 'demo@qode.world',
      name: 'Demo',
      avatarUrl: 'https://example.com/avatar.jpg',
      role: 'USER',
    });
    (prismaMock.oAuthIdentity.upsert as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (jwtServiceMock.signAsync as unknown as ReturnType<typeof vi.fn>).mockResolvedValue('internal-token');

    const result = await service.syncOAuthUser({
      provider: OAuthProvider.GOOGLE,
      providerUserId: 'google-uid-1',
      email: 'demo@qode.world',
      name: 'Demo',
      avatarUrl: 'https://example.com/avatar.jpg',
    });

    expect(prismaMock.user.upsert).toHaveBeenCalledTimes(1);
    expect(prismaMock.oAuthIdentity.upsert).toHaveBeenCalledTimes(1);
    expect(jwtServiceMock.signAsync).toHaveBeenCalledWith({
      sub: 'd0f3f5a0-e304-4e49-b782-3ae9ed413513',
      email: 'demo@qode.world',
      role: 'USER',
    });
    expect(result).toEqual({
      accessToken: 'internal-token',
      user: {
        id: 'd0f3f5a0-e304-4e49-b782-3ae9ed413513',
        email: 'demo@qode.world',
        name: 'Demo',
        avatarUrl: 'https://example.com/avatar.jpg',
        role: 'USER',
      },
    });
  });
});
