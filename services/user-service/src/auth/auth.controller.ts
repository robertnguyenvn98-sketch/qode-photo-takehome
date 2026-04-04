import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { GoogleAuthDto } from './google-auth.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('internal/auth/google')
  syncGoogleUser(@Body() body: GoogleAuthDto) {
    return this.authService.syncGoogleUser(body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('users/me')
  getCurrentUser(@Req() request: Request & { user?: unknown }) {
    return request.user;
  }
}
