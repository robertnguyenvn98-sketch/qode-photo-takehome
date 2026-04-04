import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { HealthController } from './health.controller';
import { PhotoModule } from './photo/photo.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), AuthModule, PhotoModule],
  controllers: [HealthController],
})
export class AppModule {}
