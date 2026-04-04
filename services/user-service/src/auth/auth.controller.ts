import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { SyncOAuthDto } from './google-auth.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { UserIdParamDto } from './user-id-param.dto';

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

  @UseGuards(JwtAuthGuard)
  @Get('users/:id/public')
  getPublicUserProfile(@Param() params: UserIdParamDto) {
    return this.authService.getPublicUserProfile(params.id);
  }
}
