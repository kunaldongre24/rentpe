import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import {
  DashboardAuthGuard,
  type DashboardRequest,
  requireDashboardAccount,
} from '../auth/dashboard-auth.guard.js';
import { DashboardOperationsService } from './dashboard-operations.service.js';

@Controller('dashboard')
@UseGuards(DashboardAuthGuard)
export class DashboardController {
  constructor(private readonly operations: DashboardOperationsService) {}
  @Get('me') me(@Req() request: DashboardRequest) {
    return requireDashboardAccount(request);
  }
  @Get('operations') operationsView(@Req() request: DashboardRequest) {
    return this.operations.read(requireDashboardAccount(request));
  }
}
