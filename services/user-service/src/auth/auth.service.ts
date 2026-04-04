import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import { GoogleAuthDto } from './google-auth.dto';
import { JwtPayload } from './jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async syncGoogleUser(dto: GoogleAuthDto) {
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
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        role: user.role,
      },
    };
  }
}
