import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { sql } from 'kysely';
import type { WhatsAppPropertyMessage } from '@property-assistant/types';
import { DatabaseService } from '../database/database.service.js';
import { PropertySearchService } from '../properties/property-search.service.js';
import { formatPropertyMessage } from './property-message.js';
import type { WhatsAppProvider } from './whatsapp.provider.js';

export const WHATSAPP_PROVIDER = Symbol('WHATSAPP_PROVIDER');

@Injectable()
export class WhatsAppDeliveryService {
  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
    @Inject(PropertySearchService)
    private readonly search: PropertySearchService,
    @Inject(WHATSAPP_PROVIDER) private readonly provider: WhatsAppProvider,
  ) {}

  async deliverNext(userPhone: string, limit = 3) {
    const user = await this.database.client
      .selectFrom('users')
      .select(['id'])
      .where('normalized_phone', '=', userPhone)
      .executeTakeFirst();
    if (!user) throw new NotFoundException('WhatsApp user not found');
    const search = await this.database.client
      .selectFrom('property_searches')
      .select(['id'])
      .where('user_id', '=', user.id)
      .where('status', '=', 'ACTIVE')
      .orderBy('updated_at', 'desc')
      .executeTakeFirst();
    if (!search) throw new NotFoundException('Active search not found');
    return this.deliverNextForSearch(user.id, search.id, limit);
  }

  async deliverNextForSearch(userId: string, searchId: string, limit = 3) {
    const user = await this.database.client
      .selectFrom('users')
      .select(['id', 'whatsapp_number', 'phone'])
      .where('id', '=', userId)
      .executeTakeFirst();
    if (!user) throw new NotFoundException('WhatsApp user not found');
    const search = await this.database.client
      .selectFrom('property_searches')
      .select(['id'])
      .where('id', '=', searchId)
      .where('user_id', '=', user.id)
      .where('status', '=', 'ACTIVE')
      .executeTakeFirst();
    if (!search) throw new NotFoundException('Active search not found');

    const results = await this.search.search(search.id, {
      limit: 100,
      offset: 0,
      radiusMeters: 100_000,
    });
    const delivered: WhatsAppPropertyMessage[] = [];
    for (const match of results.properties.slice(0, 100)) {
      if (delivered.length >= limit) break;
      const property = await this.database.client
        .selectFrom('properties')
        .leftJoin(
          'property_images',
          'property_images.property_id',
          'properties.id',
        )
        .leftJoin('brokers', 'brokers.id', 'properties.broker_id')
        .select([
          'properties.id',
          'properties.title',
          'properties.locality',
          'properties.city',
          'properties.rent',
          'properties.deposit',
          'properties.area',
          'properties.furnishing',
          'properties.available_from',
          'properties.amenities',
          'property_images.storage_path as image_path',
          'brokers.name as broker_name',
          'brokers.phone as broker_phone',
        ])
        .where('properties.id', '=', match.id)
        .executeTakeFirst();
      if (!property) continue;
      const notification = await this.database.client
        .insertInto('property_notifications')
        .values({
          user_id: user.id,
          search_id: search.id,
          property_id: property.id,
          channel: 'whatsapp',
          status: 'pending',
        })
        .onConflict((conflict) =>
          conflict
            .columns(['user_id', 'search_id', 'property_id', 'channel'])
            .doUpdateSet({ status: 'pending' })
            .where('property_notifications.status', '=', 'failed'),
        )
        .returning('id')
        .executeTakeFirst();
      if (!notification) continue;
      const message = formatPropertyMessage(
        {
          ...property,
          image_path: property.image_path ?? undefined,
          broker_name: property.broker_name ?? undefined,
          broker_phone: property.broker_phone ?? undefined,
        },
        user.whatsapp_number ?? user.phone,
      );
      try {
        await this.provider.sendProperty(message);
        await this.database.client
          .updateTable('property_notifications')
          .set({ status: 'sent', sent_at: new Date().toISOString() })
          .where('id', '=', notification.id)
          .execute();
        delivered.push(message);
      } catch {
        await this.database.client
          .updateTable('property_notifications')
          .set({ status: 'failed' })
          .where('id', '=', notification.id)
          .execute();
      }
    }
    return { searchId: search.id, delivered };
  }

  async deliveryCount(userId: string, searchId: string) {
    const result = await sql<{ count: string }>`
      select count(*)::text as count from property_notifications
      where user_id = ${userId} and search_id = ${searchId} and channel = 'whatsapp'
        and status = 'sent'
    `.execute(this.database.client);
    return Number(result.rows[0]?.count ?? 0);
  }
}
