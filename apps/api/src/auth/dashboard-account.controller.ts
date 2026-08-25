import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  dashboardAccountCreateSchema,
  dashboardAccountStatusUpdateSchema,
  uuidSchema,
} from '@property-assistant/types';
import { parseRequest } from '../common/request.js';
import { DashboardAuthGuard } from './dashboard-auth.guard.js';
import { AdminGuard } from './role.guards.js';
import { DashboardAccountRepository } from './dashboard-account.repository.js';

@Controller('admin/accounts')
@UseGuards(DashboardAuthGuard, AdminGuard)
export class DashboardAccountController {
  constructor(private readonly accounts: DashboardAccountRepository) {}
  @Get() list() {
    return this.accounts.list();
  }
  @Post() create(@Body() body: unknown) {
    return this.accounts.create(
      parseRequest(dashboardAccountCreateSchema, body),
    );
  }
  @Patch(':id/status') updateStatus(
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    return this.accounts.updateStatus(
      parseRequest(uuidSchema, id),
      parseRequest(dashboardAccountStatusUpdateSchema, body).status,
    );
  }
}
