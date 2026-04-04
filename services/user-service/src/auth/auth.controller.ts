import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { SyncOAuthDto } from './google-auth.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('internal/users/sync-oauth')
  syncOAuthUser(@Body() body: SyncOAuthDto) {
    return this.authService.syncOAuthUser(body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('users/me')
  getCurrentUser(@Req() request: Request & { user?: { sub?: string } }) {
    return this.authService.getCurrentUserProfile(request.user?.sub ?? '');
  }

  @Get('users/:id/public')
  getPublicUserProfile(@Req() request: Request & { params: { id: string } }) {
    return this.authService.getPublicUserProfile(request.params.id);
  }
}
