import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PhotoController } from './photo.controller';
import { PhotoService } from './photo.service';
import { PrismaService } from '../prisma.service';
import { CloudinaryService } from './cloudinary.service';
import { RateLimitService } from './rate-limit.service';
import { UsersClientService } from './users-client.service';

@Module({
  imports: [ConfigModule, JwtModule],
  controllers: [PhotoController],
  providers: [
    PhotoService,
    PrismaService,
    CloudinaryService,
    UsersClientService,
    RateLimitService,
  ],
})
export class PhotoModule {}
