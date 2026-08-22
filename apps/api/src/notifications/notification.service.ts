import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { PropertyNotificationTrigger } from '@property-assistant/types';
import { DatabaseService } from '../database/database.service.js';
import { PropertySearchService } from '../properties/property-search.service.js';
import { formatPropertyMessage } from '../whatsapp/property-message.js';
import { WHATSAPP_PROVIDER } from '../whatsapp/whatsapp-delivery.service.js';
import type { WhatsAppProvider } from '../whatsapp/whatsapp.provider.js';

const proactiveMatchThreshold = 75;
const maxSearchesPerProperty = 50;

@Injectable()
export class NotificationService {
  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
    @Inject(PropertySearchService)
    private readonly propertySearch: PropertySearchService,
    @Inject(WHATSAPP_PROVIDER)
    private readonly whatsapp: WhatsAppProvider,
  ) {}

  async notifyNewProperty(input: PropertyNotificationTrigger) {
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
        'properties.status',
        'properties.city',
        'properties.locality',
        'properties.title',
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
      .where('properties.id', '=', input.propertyId)
      .executeTakeFirst();
    if (!property) throw new NotFoundException('Property not found');
    if (property.status !== 'ACTIVE') return { eligible: 0, sent: 0 };

    const searches = await this.database.client
      .selectFrom('property_searches')
      .innerJoin('users', 'users.id', 'property_searches.user_id')
      .select([
        'property_searches.id as search_id',
        'property_searches.user_id',
        'users.phone',
        'users.whatsapp_number',
      ])
      .where('property_searches.status', '=', 'ACTIVE')
      .limit(maxSearchesPerProperty)
      .execute();
    let eligible = 0;
    let sent = 0;
    for (const search of searches) {
      const result = await this.propertySearch.search(search.search_id, {
        limit: 100,
        offset: 0,
        radiusMeters: 100_000,
      });
      const match = result.properties.find(
        (candidate) => candidate.id === property.id,
      );
      if (!match || Number(match.score) < proactiveMatchThreshold) continue;
      eligible += 1;
      const notification = await this.database.client
        .insertInto('property_notifications')
        .values({
          user_id: search.user_id,
          search_id: search.search_id,
          property_id: property.id,
          channel: 'whatsapp',
          status: 'pending',
        })
        .onConflict((conflict) => conflict.doNothing())
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
        search.whatsapp_number ?? search.phone,
      );
      try {
        await this.whatsapp.sendProperty(message);
        await this.database.client
          .updateTable('property_notifications')
          .set({ status: 'sent', sent_at: new Date().toISOString() })
          .where('id', '=', notification.id)
          .execute();
        sent += 1;
      } catch {
        await this.database.client
          .updateTable('property_notifications')
          .set({ status: 'failed' })
          .where('id', '=', notification.id)
          .execute();
      }
    }
    return { eligible, sent };
  }
}
