import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { DashboardRole } from '@property-assistant/types';
import { DashboardAuthService } from './dashboard-auth.service.js';
import {
  type DashboardRequest,
  requireDashboardAccount,
} from './dashboard-auth.guard.js';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    if (
      requireDashboardAccount(
        context.switchToHttp().getRequest<DashboardRequest>(),
      ).role !== 'ADMIN'
    )
      throw new ForbiddenException('Admin access required');
    return true;
  }
}

@Injectable()
export class PartnerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const role = requireDashboardAccount(
      context.switchToHttp().getRequest<DashboardRequest>(),
    ).role;
    if (role !== 'ADMIN' && role !== 'BROKER' && role !== 'OWNER')
      throw new ForbiddenException('Partner access required');
    return true;
  }
}

@Injectable()
export class ProductionAdminGuard implements CanActivate {
  constructor(private readonly auth: DashboardAuthService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (process.env.NODE_ENV !== 'production') return true;
    const request = context.switchToHttp().getRequest<DashboardRequest>();
    const account = await this.auth.authenticate(request.headers.authorization);
    if (account.role !== 'ADMIN')
      throw new ForbiddenException('Admin access required');
    request.dashboardAccount = account;
    return true;
  }
}

export function assertRole(request: DashboardRequest, roles: DashboardRole[]) {
  const account = requireDashboardAccount(request);
  if (!roles.includes(account.role))
    throw new ForbiddenException('Insufficient dashboard permissions');
  return account;
}
