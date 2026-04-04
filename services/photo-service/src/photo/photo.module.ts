import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PhotoController } from './photo.controller';
import { PhotoService } from './photo.service';
import { PrismaService } from '../prisma.service';
import { CloudinaryService } from './cloudinary.service';
import { UsersClientService } from './users-client.service';

@Module({
  imports: [ConfigModule],
  controllers: [PhotoController],
  providers: [PhotoService, PrismaService, CloudinaryService, UsersClientService],
})
export class PhotoModule {}
