import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { DashboardAccountController } from './dashboard-account.controller.js';
import { DashboardAccountRepository } from './dashboard-account.repository.js';
import { DashboardAuthGuard } from './dashboard-auth.guard.js';
import { DashboardAuthService } from './dashboard-auth.service.js';
import { AdminGuard, PartnerGuard } from './role.guards.js';

@Module({
  imports: [DatabaseModule],
  controllers: [DashboardAccountController],
  providers: [
    DashboardAccountRepository,
    DashboardAuthService,
    DashboardAuthGuard,
    AdminGuard,
    PartnerGuard,
  ],
  exports: [
    DashboardAccountRepository,
    DashboardAuthService,
    DashboardAuthGuard,
    AdminGuard,
    PartnerGuard,
  ],
})
export class AuthModule {}
