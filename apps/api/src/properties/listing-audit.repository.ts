import { Inject, Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';

@Injectable()
export class ListingAuditRepository {
  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
  ) {}
  record(input: {
    propertyId: string;
    actorAccountId: string;
    action: string;
    previousStatus?: string | null;
    newStatus?: string | null;
  }) {
    return this.database.client
      .insertInto('listing_audit_events')
      .values({
        property_id: input.propertyId,
        actor_account_id: input.actorAccountId,
        action: input.action,
        previous_status: input.previousStatus ?? null,
        new_status: input.newStatus ?? null,
        metadata: JSON.stringify({}),
      })
      .execute();
  }
}
