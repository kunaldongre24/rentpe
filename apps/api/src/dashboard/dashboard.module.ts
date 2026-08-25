import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { DatabaseModule } from '../database/database.module.js';
import { DashboardController } from './dashboard.controller.js';
import { DashboardOperationsService } from './dashboard-operations.service.js';

@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [DashboardController],
  providers: [DashboardOperationsService],
})
export class DashboardModule {}
