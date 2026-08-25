import { Global, Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { DashboardAccountController } from './dashboard-account.controller.js';
import { DashboardAccountRepository } from './dashboard-account.repository.js';
import { DashboardAuthGuard } from './dashboard-auth.guard.js';
import { DashboardAuthService } from './dashboard-auth.service.js';
import {
  AdminGuard,
  PartnerGuard,
  ProductionAdminGuard,
} from './role.guards.js';

@Global()
@Module({
  imports: [DatabaseModule],
  controllers: [DashboardAccountController],
  providers: [
    DashboardAccountRepository,
    DashboardAuthService,
    DashboardAuthGuard,
    AdminGuard,
    PartnerGuard,
    ProductionAdminGuard,
  ],
  exports: [
    DashboardAccountRepository,
    DashboardAuthService,
    DashboardAuthGuard,
    AdminGuard,
    PartnerGuard,
    ProductionAdminGuard,
  ],
})
export class AuthModule {}
