import { Inject, Injectable } from '@nestjs/common';
import type { DashboardAccountCreate } from '@property-assistant/types';
import { DatabaseService } from '../database/database.service.js';

@Injectable()
export class DashboardAccountRepository {
  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
  ) {}
  findByAuthUserId(authUserId: string) {
    return this.database.client
      .selectFrom('dashboard_accounts')
      .selectAll()
      .where('auth_user_id', '=', authUserId)
      .executeTakeFirst();
  }
  list() {
    return this.database.client
      .selectFrom('dashboard_accounts')
      .selectAll()
      .orderBy('created_at', 'desc')
      .execute();
  }
  create(input: DashboardAccountCreate) {
    return this.database.client
      .insertInto('dashboard_accounts')
      .values({
        auth_user_id: input.authUserId,
        email: input.email,
        display_name: input.displayName ?? null,
        phone: input.phone ?? null,
        role: input.role,
        status: 'ACTIVE',
        broker_id: input.brokerId ?? null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }
  updateStatus(id: string, status: 'ACTIVE' | 'SUSPENDED') {
    return this.database.client
      .updateTable('dashboard_accounts')
      .set({ status, updated_at: new Date().toISOString() })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();
  }
}
