import { describe, expect, it, vi } from 'vitest';
import { UnauthorizedException } from '@nestjs/common';
import { DashboardAuthGuard } from './dashboard-auth.guard.js';

describe('DashboardAuthGuard', () => {
  it('attaches the authenticated account to the request', async () => {
    const account = { id: 'account-1', role: 'ADMIN' };
    const auth = { authenticate: vi.fn().mockResolvedValue(account) };
    const request = { headers: { authorization: 'Bearer token' } };
    const context = { switchToHttp: () => ({ getRequest: () => request }) };
    await expect(
      new DashboardAuthGuard(auth as never).canActivate(context as never),
    ).resolves.toBe(true);
    expect(request).toMatchObject({ dashboardAccount: account });
  });
  it('propagates rejected sessions', async () => {
    const auth = {
      authenticate: vi.fn().mockRejectedValue(new UnauthorizedException()),
    };
    const context = {
      switchToHttp: () => ({ getRequest: () => ({ headers: {} }) }),
    };
    await expect(
      new DashboardAuthGuard(auth as never).canActivate(context as never),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
