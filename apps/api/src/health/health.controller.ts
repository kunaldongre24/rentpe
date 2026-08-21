import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';

@Controller('health')
export class HealthController {
  constructor(private readonly database: DatabaseService) {}

  @Get()
  async getHealth(): Promise<Record<string, string>> {
    const common = {
      api: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? '0.1.0',
    };
    try {
      await this.database.check();
      return { status: 'ok', database: 'healthy', ...common };
    } catch {
      throw new ServiceUnavailableException({
        status: 'degraded',
        database: 'unavailable',
        ...common,
      });
    }
  }
}
