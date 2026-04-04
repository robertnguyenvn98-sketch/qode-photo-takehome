import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  getHealth() {
    return {
      status: 'ok',
      version: process.env.SERVICE_VERSION ?? '0.1.0',
    };
  }
}
