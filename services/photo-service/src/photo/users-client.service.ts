import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UploaderSummary } from './types';

@Injectable()
export class UsersClientService {
  private readonly userServiceUrl: string;

  constructor(configService: ConfigService) {
    this.userServiceUrl = configService.get<string>('USER_SERVICE_URL') ?? 'http://localhost:4001';
  }

  async getUploaderSummary(userId: string): Promise<UploaderSummary> {
    try {
      const response = await fetch(`${this.userServiceUrl}/users/${userId}/public`);
      if (!response.ok) {
        return { id: userId, name: null, avatarUrl: null };
      }

      return (await response.json()) as UploaderSummary;
    } catch {
      return { id: userId, name: null, avatarUrl: null };
    }
  }
}
