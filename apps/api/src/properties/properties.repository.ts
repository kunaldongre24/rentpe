import { Inject, Injectable } from '@nestjs/common';
import type {
  Pagination,
  PropertyCreate,
  PropertyUpdate,
} from '@property-assistant/types';
import { DatabaseService } from '../database/database.service.js';

@Injectable()
export class PropertiesRepository {
  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
  ) {}
  list(p: Pagination, brokerId?: string) {
    let query = this.database.client
      .selectFrom('properties')
      .selectAll()
      .where('status', '!=', 'DELETED');
    if (brokerId) query = query.where('broker_id', '=', brokerId);
    return query
      .orderBy('created_at', 'desc')
      .limit(p.limit)
      .offset(p.offset)
      .execute();
  }
  findById(id: string) {
    return this.database.client
      .selectFrom('properties')
      .selectAll()
      .where('id', '=', id)
      .where('status', '!=', 'DELETED')
      .executeTakeFirst();
  }
  create(i: PropertyCreate) {
    return this.database.client
      .insertInto('properties')
      .values({
        broker_id: i.brokerId,
        location_id: i.locationId,
        title: i.title,
        description: i.description,
        property_type: i.propertyType,
        bhk: i.bhk,
        rent: i.rent,
        deposit: i.deposit ?? null,
        area: i.area,
        area_sqft: i.area,
        furnishing: i.furnishing,
        floor: i.floor ?? null,
        total_floors: i.totalFloors ?? null,
        parking: i.parking,
        balcony: i.balcony,
        amenities: JSON.stringify(i.amenities),
        address: i.address,
        locality: i.locality,
        city: i.city,
        latitude: i.latitude,
        longitude: i.longitude,
        available_from: i.availableFrom,
        status: i.status,
        quality_score: i.qualityScore,
        freshness_score: i.freshnessScore,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }
  update(id: string, i: PropertyUpdate) {
    return this.database.client
      .updateTable('properties')
      .set({
        ...(i.brokerId !== undefined ? { broker_id: i.brokerId } : {}),
        ...(i.locationId !== undefined ? { location_id: i.locationId } : {}),
        ...(i.title !== undefined ? { title: i.title } : {}),
        ...(i.description !== undefined ? { description: i.description } : {}),
        ...(i.propertyType !== undefined
          ? { property_type: i.propertyType }
          : {}),
        ...(i.bhk !== undefined ? { bhk: i.bhk } : {}),
        ...(i.rent !== undefined ? { rent: i.rent } : {}),
        ...(i.deposit !== undefined ? { deposit: i.deposit } : {}),
        ...(i.area !== undefined ? { area: i.area, area_sqft: i.area } : {}),
        ...(i.furnishing !== undefined ? { furnishing: i.furnishing } : {}),
        ...(i.floor !== undefined ? { floor: i.floor } : {}),
        ...(i.totalFloors !== undefined ? { total_floors: i.totalFloors } : {}),
        ...(i.parking !== undefined ? { parking: i.parking } : {}),
        ...(i.balcony !== undefined ? { balcony: i.balcony } : {}),
        ...(i.amenities !== undefined
          ? { amenities: JSON.stringify(i.amenities) }
          : {}),
        ...(i.address !== undefined ? { address: i.address } : {}),
        ...(i.locality !== undefined ? { locality: i.locality } : {}),
        ...(i.city !== undefined ? { city: i.city } : {}),
        ...(i.latitude !== undefined ? { latitude: i.latitude } : {}),
        ...(i.longitude !== undefined ? { longitude: i.longitude } : {}),
        ...(i.availableFrom !== undefined
          ? { available_from: i.availableFrom }
          : {}),
        ...(i.status !== undefined ? { status: i.status } : {}),
        ...(i.qualityScore !== undefined
          ? { quality_score: i.qualityScore }
          : {}),
        ...(i.freshnessScore !== undefined
          ? { freshness_score: i.freshnessScore }
          : {}),
        updated_at: new Date().toISOString(),
      })
      .where('id', '=', id)
      .where('status', '!=', 'DELETED')
      .returningAll()
      .executeTakeFirst();
  }
  async softDelete(id: string) {
    return this.database.client
      .updateTable('properties')
      .set({ status: 'DELETED', updated_at: new Date().toISOString() })
      .where('id', '=', id)
      .where('status', '!=', 'DELETED')
      .returning('id')
      .executeTakeFirst();
  }
}
