import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  Pagination,
  PropertyCreate,
  PropertyUpdate,
} from '@property-assistant/types';
import { DatabaseService } from '../database/database.service.js';

@Injectable()
export class PropertiesService {
  constructor(private readonly database: DatabaseService) {}

  async list(pagination: Pagination) {
    return this.database.client
      .selectFrom('properties')
      .selectAll()
      .where('status', '!=', 'DELETED')
      .orderBy('created_at desc')
      .limit(pagination.limit)
      .offset(pagination.offset)
      .execute();
  }

  async get(id: string) {
    const property = await this.database.client
      .selectFrom('properties')
      .selectAll()
      .where('id', '=', id)
      .where('status', '!=', 'DELETED')
      .executeTakeFirst();
    if (!property) throw new NotFoundException('Property not found');
    return property;
  }

  async create(input: PropertyCreate) {
    return this.database.client
      .insertInto('properties')
      .values({
        broker_id: input.brokerId,
        location_id: input.locationId,
        title: input.title,
        description: input.description,
        property_type: input.propertyType,
        bhk: input.bhk,
        rent: input.rent,
        deposit: input.deposit ?? null,
        area: input.area,
        area_sqft: input.area,
        furnishing: input.furnishing,
        floor: input.floor ?? null,
        total_floors: input.totalFloors ?? null,
        parking: input.parking,
        balcony: input.balcony,
        amenities: JSON.stringify(input.amenities),
        address: input.address,
        locality: input.locality,
        city: input.city,
        latitude: input.latitude,
        longitude: input.longitude,
        available_from: input.availableFrom,
        status: input.status,
        quality_score: input.qualityScore,
        freshness_score: input.freshnessScore,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async update(id: string, input: PropertyUpdate) {
    const values = {
      ...(input.brokerId !== undefined ? { broker_id: input.brokerId } : {}),
      ...(input.locationId !== undefined
        ? { location_id: input.locationId }
        : {}),
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.description !== undefined
        ? { description: input.description }
        : {}),
      ...(input.propertyType !== undefined
        ? { property_type: input.propertyType }
        : {}),
      ...(input.bhk !== undefined ? { bhk: input.bhk } : {}),
      ...(input.rent !== undefined ? { rent: input.rent } : {}),
      ...(input.deposit !== undefined ? { deposit: input.deposit } : {}),
      ...(input.area !== undefined
        ? { area: input.area, area_sqft: input.area }
        : {}),
      ...(input.furnishing !== undefined
        ? { furnishing: input.furnishing }
        : {}),
      ...(input.floor !== undefined ? { floor: input.floor } : {}),
      ...(input.totalFloors !== undefined
        ? { total_floors: input.totalFloors }
        : {}),
      ...(input.parking !== undefined ? { parking: input.parking } : {}),
      ...(input.balcony !== undefined ? { balcony: input.balcony } : {}),
      ...(input.amenities !== undefined
        ? { amenities: JSON.stringify(input.amenities) }
        : {}),
      ...(input.address !== undefined ? { address: input.address } : {}),
      ...(input.locality !== undefined ? { locality: input.locality } : {}),
      ...(input.city !== undefined ? { city: input.city } : {}),
      ...(input.latitude !== undefined ? { latitude: input.latitude } : {}),
      ...(input.longitude !== undefined ? { longitude: input.longitude } : {}),
      ...(input.availableFrom !== undefined
        ? { available_from: input.availableFrom }
        : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.qualityScore !== undefined
        ? { quality_score: input.qualityScore }
        : {}),
      ...(input.freshnessScore !== undefined
        ? { freshness_score: input.freshnessScore }
        : {}),
      updated_at: new Date().toISOString(),
    };
    const property = await this.database.client
      .updateTable('properties')
      .set(values)
      .where('id', '=', id)
      .where('status', '!=', 'DELETED')
      .returningAll()
      .executeTakeFirst();
    if (!property) throw new NotFoundException('Property not found');
    return property;
  }

  async remove(id: string): Promise<void> {
    const property = await this.database.client
      .updateTable('properties')
      .set({ status: 'DELETED', updated_at: new Date().toISOString() })
      .where('id', '=', id)
      .where('status', '!=', 'DELETED')
      .returning('id')
      .executeTakeFirst();
    if (!property) throw new NotFoundException('Property not found');
  }
}
