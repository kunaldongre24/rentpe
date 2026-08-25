import { Inject, Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import type { DashboardAccount } from '../auth/dashboard-auth.service.js';

@Injectable()
export class DashboardOperationsService {
  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
  ) {}

  async read(account: DashboardAccount) {
    let propertyQuery = this.database.client
      .selectFrom('properties')
      .selectAll()
      .where('status', '!=', 'DELETED');
    if (account.role !== 'ADMIN')
      propertyQuery = propertyQuery.where('broker_id', '=', account.brokerId!);
    const [properties, brokers, locations, calls, searches, users] =
      await Promise.all([
        propertyQuery.orderBy('created_at', 'desc').limit(100).execute(),
        account.role === 'ADMIN'
          ? this.database.client
              .selectFrom('brokers')
              .selectAll()
              .orderBy('created_at', 'desc')
              .limit(100)
              .execute()
          : this.database.client
              .selectFrom('brokers')
              .selectAll()
              .where('id', '=', account.brokerId!)
              .execute(),
        this.database.client
          .selectFrom('locations')
          .selectAll()
          .orderBy('name')
          .limit(100)
          .execute(),
        account.role === 'ADMIN'
          ? this.database.client
              .selectFrom('call_sessions')
              .selectAll()
              .orderBy('started_at', 'desc')
              .limit(100)
              .execute()
          : Promise.resolve([]),
        account.role === 'ADMIN'
          ? this.database.client
              .selectFrom('property_searches')
              .selectAll()
              .orderBy('created_at', 'desc')
              .limit(100)
              .execute()
          : Promise.resolve([]),
        account.role === 'ADMIN'
          ? this.database.client
              .selectFrom('users')
              .selectAll()
              .orderBy('created_at', 'desc')
              .limit(100)
              .execute()
          : Promise.resolve([]),
      ]);
    return { account, properties, brokers, locations, calls, searches, users };
  }
}
