import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import { SyncOAuthDto } from './google-auth.dto';
import { JwtPayload } from './jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async syncOAuthUser(dto: SyncOAuthDto) {
    const user = await this.prisma.user.upsert({
      where: { email: dto.email },
      update: {
        name: dto.name ?? undefined,
        avatarUrl: dto.avatarUrl ?? undefined,
      },
      create: {
        email: dto.email,
        name: dto.name ?? null,
        avatarUrl: dto.avatarUrl ?? null,
      },
    });

    await this.prisma.oAuthIdentity.upsert({
      where: {
        provider_providerUserId: {
          provider: dto.provider,
          providerUserId: dto.providerUserId,
        },
      },
      update: {
        userId: user.id,
      },
      create: {
        provider: dto.provider,
        providerUserId: dto.providerUserId,
        userId: user.id,
      },
    });

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user: this.normalizeUser(user),
    };
  }

  async getCurrentUserProfile(userId: string) {
    if (!userId) {
      throw new UnauthorizedException('Missing authenticated user id');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.normalizeUser(user);
  }

  async getPublicUserProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  private normalizeUser(user: {
    id: string;
    email: string;
    name: string | null;
    avatarUrl: string | null;
    role: string;
  }) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      role: user.role,
    };
  }
}
