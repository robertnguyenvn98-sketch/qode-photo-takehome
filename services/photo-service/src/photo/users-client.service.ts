import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UploaderSummary } from './types';

@Injectable()
export class UsersClientService {
  private readonly userServiceUrl: string;
  private readonly internalSecret: string;

  constructor(
    configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {
    this.userServiceUrl = configService.get<string>('USER_SERVICE_URL') ?? 'http://localhost:4001';
    this.internalSecret =
      configService.get<string>('INTERNAL_JWT_SECRET') ?? 'development-internal-secret';
  }

  async getUploaderSummary(userId: string): Promise<UploaderSummary> {
    try {
      const accessToken = await this.jwtService.signAsync(
        {
          sub: 'photo-service',
          email: 'photo-service@internal.local',
          role: 'ADMIN',
        },
        {
          secret: this.internalSecret,
          expiresIn: '60s',
        },
      );

      const response = await fetch(`${this.userServiceUrl}/users/${userId}/public`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!response.ok) {
        return { id: userId, name: null, avatarUrl: null };
      }

      return (await response.json()) as UploaderSummary;
    } catch {
      return { id: userId, name: null, avatarUrl: null };
    }
  }
}
