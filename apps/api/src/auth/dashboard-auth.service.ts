import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { DatabaseService } from '../database/database.service.js';

export interface DashboardAccount {
  id: string;
  authUserId: string;
  email: string;
  displayName: string | null;
  role: 'ADMIN' | 'BROKER' | 'OWNER';
  status: 'INVITED' | 'ACTIVE' | 'SUSPENDED';
  brokerId: string | null;
}

@Injectable()
export class DashboardAuthService {
  private issuer?: string;
  private audience?: string;
  private keys?: ReturnType<typeof createRemoteJWKSet>;

  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
  ) {}

  private getVerificationConfig() {
    if (this.keys && this.issuer && this.audience)
      return { keys: this.keys, issuer: this.issuer, audience: this.audience };
    const supabaseUrl = process.env.SUPABASE_URL;
    if (!supabaseUrl)
      throw new UnauthorizedException(
        'Dashboard authentication is not configured',
      );
    this.issuer =
      process.env.SUPABASE_ISSUER ??
      `${supabaseUrl.replace(/\/$/, '')}/auth/v1`;
    this.audience = process.env.SUPABASE_AUDIENCE ?? 'authenticated';
    this.keys = createRemoteJWKSet(
      new URL(
        process.env.SUPABASE_JWKS_URL ?? `${this.issuer}/.well-known/jwks.json`,
      ),
    );
    return { keys: this.keys, issuer: this.issuer, audience: this.audience };
  }

  async authenticate(
    authorization: string | undefined,
  ): Promise<DashboardAccount> {
    if (!authorization?.startsWith('Bearer '))
      throw new UnauthorizedException('Authentication required');
    const token = authorization.slice('Bearer '.length);
    let subject: string;
    try {
      const config = this.getVerificationConfig();
      const verified = await jwtVerify(token, config.keys, {
        issuer: config.issuer,
        audience: config.audience,
      });
      if (!verified.payload.sub) throw new Error('Token subject is missing');
      subject = verified.payload.sub;
    } catch {
      throw new UnauthorizedException('Invalid or expired session');
    }
    const account = await this.database.client
      .selectFrom('dashboard_accounts')
      .selectAll()
      .where('auth_user_id', '=', subject)
      .executeTakeFirst();
    if (!account || account.status !== 'ACTIVE')
      throw new UnauthorizedException('Dashboard account is not active');
    return {
      id: account.id,
      authUserId: account.auth_user_id,
      email: account.email,
      displayName: account.display_name,
      role: account.role as DashboardAccount['role'],
      status: account.status as DashboardAccount['status'],
      brokerId: account.broker_id,
    };
  }
}
