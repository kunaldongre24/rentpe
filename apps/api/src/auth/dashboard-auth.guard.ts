import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import {
  DashboardAuthService,
  type DashboardAccount,
} from './dashboard-auth.service.js';

export interface DashboardRequest {
  headers: { authorization?: string };
  dashboardAccount?: DashboardAccount;
}

@Injectable()
export class DashboardAuthGuard implements CanActivate {
  constructor(private readonly auth: DashboardAuthService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<DashboardRequest>();
    request.dashboardAccount = await this.auth.authenticate(
      request.headers.authorization,
    );
    return true;
  }
}

export function requireDashboardAccount(
  request: DashboardRequest,
): DashboardAccount {
  if (!request.dashboardAccount)
    throw new Error('Dashboard guard did not attach an account');
  return request.dashboardAccount;
}
