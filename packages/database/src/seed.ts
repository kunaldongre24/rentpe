import { sql, type Transaction } from 'kysely';
import { createDatabase } from './client.js';
import { readDatabaseConfig } from './config.js';
import type { Database } from './types.js';

const localities = [
  [
    'HSR Layout',
    12.9116,
    77.6389,
    ['HSR', 'H.S.R Layout', '14th Main HSR', '14th Main, HSR'],
  ],
  ['Koramangala', 12.9352, 77.6245, ['Koramangala 5th Block']],
  ['Indiranagar', 12.9784, 77.6408, []],
  ['Whitefield', 12.9698, 77.75, []],
  ['Bellandur', 12.925, 77.676, []],
  ['Sarjapur', 12.86, 77.786, ['Sarjapur Road']],
  ['Electronic City', 12.8452, 77.6602, ['E City']],
  ['Marathahalli', 12.9591, 77.6974, []],
  ['BTM Layout', 12.9166, 77.6101, ['BTM']],
  ['JP Nagar', 12.9063, 77.5857, ['J. P. Nagar']],
] as const;

const propertyCount = 120;

export interface SeedStats {
  locationsInserted: number;
  locationsUpdated: number;
  locationsSkipped: number;
  brokersInserted: number;
  brokersUpdated: number;
  brokersSkipped: number;
  propertiesInserted: number;
  propertiesUpdated: number;
  propertiesSkipped: number;
  propertyImagesInserted: number;
  propertyImagesUpdated: number;
  propertyImagesSkipped: number;
  inserted: number;
  updated: number;
  skipped: number;
}

type MutableSeedStats = Omit<SeedStats, 'inserted' | 'updated' | 'skipped'>;
type SeedEntity = 'locations' | 'brokers' | 'properties' | 'propertyImages';
type SeedOutcome = 'Inserted' | 'Updated' | 'Skipped';

function uuid(prefix: '0' | '1' | '2' | '3', sequence: number): string {
  return `${prefix}0000000-0000-4000-8000-${String(sequence).padStart(12, '0')}`;
}

const statisticKeys = {
  locations: {
    Inserted: 'locationsInserted',
    Updated: 'locationsUpdated',
    Skipped: 'locationsSkipped',
  },
  brokers: {
    Inserted: 'brokersInserted',
    Updated: 'brokersUpdated',
    Skipped: 'brokersSkipped',
  },
  properties: {
    Inserted: 'propertiesInserted',
    Updated: 'propertiesUpdated',
    Skipped: 'propertiesSkipped',
  },
  propertyImages: {
    Inserted: 'propertyImagesInserted',
    Updated: 'propertyImagesUpdated',
    Skipped: 'propertyImagesSkipped',
  },
} as const satisfies Record<
  SeedEntity,
  Record<SeedOutcome, keyof MutableSeedStats>
>;

function increment(
  stats: MutableSeedStats,
  entity: SeedEntity,
  outcome: SeedOutcome,
): void {
  const key = statisticKeys[entity][outcome];
  stats[key] += 1;
}

async function seedLocations(
  trx: Transaction<Database>,
  stats: MutableSeedStats,
): Promise<void> {
  for (let index = 0; index < localities.length; index += 1) {
    const locality = localities[index];
    if (!locality) throw new Error(`Missing seed locality at index ${index}`);
    const [name, latitude, longitude, aliases] = locality;
    const desired = {
      id: uuid('0', index + 1),
      name,
      normalizedName: name.toLowerCase().replaceAll(' ', '-'),
      aliases: [...aliases],
      latitude,
      longitude,
    };
    const result = await sql<{ inserted: boolean }>`
      insert into locations (id,name,country,state,city,locality,normalized_name,aliases,latitude,longitude)
      values (${desired.id},${desired.name},'India','Karnataka','Bengaluru',${desired.name},${desired.normalizedName},${JSON.stringify(desired.aliases)}::jsonb,${desired.latitude},${desired.longitude})
      on conflict (normalized_name) do update set
        name=excluded.name, country=excluded.country, state=excluded.state, city=excluded.city,
        locality=excluded.locality, aliases=excluded.aliases, latitude=excluded.latitude,
        longitude=excluded.longitude, updated_at=now()
      where (locations.name,locations.country,locations.state,locations.city,locations.locality,locations.aliases,locations.latitude,locations.longitude)
        is distinct from (excluded.name,excluded.country,excluded.state,excluded.city,excluded.locality,excluded.aliases,excluded.latitude,excluded.longitude)
      returning (xmax = 0) inserted
    `.execute(trx);
    const row = result.rows[0];
    increment(
      stats,
      'locations',
      row ? (row.inserted ? 'Inserted' : 'Updated') : 'Skipped',
    );
  }
}

async function seedBrokers(
  trx: Transaction<Database>,
  stats: MutableSeedStats,
): Promise<void> {
  for (let index = 1; index <= 20; index += 1) {
    const desired = {
      id: uuid('1', index),
      name: `Fictional Broker ${index}`,
      phone: `+9199000${String(index).padStart(5, '0')}`,
      company: `Demo Realty ${((index - 1) % 5) + 1}`,
      responseRate: 65 + (index % 30),
      responseTime: 15 + index,
      quality: 60 + (index % 35),
    };
    const result = await sql<{ inserted: boolean }>`
      insert into brokers (id,name,phone,normalized_phone,phone_number,company,verification_status,response_rate,response_score,response_time_minutes,quality_score,active)
      values (${desired.id},${desired.name},${desired.phone},${desired.phone},${desired.phone},${desired.company},'verified',${desired.responseRate},${desired.responseRate},${desired.responseTime},${desired.quality},true)
      on conflict (id) do update set
        name=excluded.name, phone=excluded.phone, normalized_phone=excluded.normalized_phone,
        phone_number=excluded.phone_number, company=excluded.company,
        verification_status=excluded.verification_status, response_rate=excluded.response_rate,
        response_score=excluded.response_score, response_time_minutes=excluded.response_time_minutes,
        quality_score=excluded.quality_score, active=excluded.active, updated_at=now()
      where (brokers.name,brokers.phone,brokers.normalized_phone,brokers.phone_number,brokers.company,
        brokers.verification_status,brokers.response_rate,brokers.response_score,
        brokers.response_time_minutes,brokers.quality_score,brokers.active)
        is distinct from (excluded.name,excluded.phone,excluded.normalized_phone,excluded.phone_number,excluded.company,
        excluded.verification_status,excluded.response_rate,excluded.response_score,
        excluded.response_time_minutes,excluded.quality_score,excluded.active)
      returning (xmax = 0) inserted
    `.execute(trx);
    const row = result.rows[0];
    increment(
      stats,
      'brokers',
      row ? (row.inserted ? 'Inserted' : 'Updated') : 'Skipped',
    );
  }
}

async function seedProperties(
  trx: Transaction<Database>,
  stats: MutableSeedStats,
): Promise<void> {
  for (let index = 1; index <= propertyCount; index += 1) {
    const localityIndex = (index - 1) % localities.length;
    const [locality, latitude, longitude] = localities[localityIndex]!;
    const bhk = (index % 3) + 1;
    const rent = 18_000 + ((index * 1_375) % 22_000);
    const furnishing =
      index % 3 === 0
        ? 'fully_furnished'
        : index % 3 === 1
          ? 'semi_furnished'
          : 'unfurnished';
    const propertyId = uuid('2', index);
    const area = 650 + (index % 8) * 100;
    const floor = (index % 8) + 1;
    const parking = index % 2 === 0;
    const balcony = index % 3;
    const quality = 65 + (index % 35);
    const freshness = 70 + (index % 30);
    const propertyLatitude = latitude + (index % 5) * 0.0001;
    const propertyLongitude = longitude + (index % 5) * 0.0001;
    const availableFrom = `2030-01-${String((index % 28) + 1).padStart(2, '0')}`;
    const amenities = parking ? ['parking', 'security'] : ['security'];
    const result = await sql<{ inserted: boolean }>`
      insert into properties (
        id,broker_id,location_id,title,description,property_type,bhk,rent,deposit,area,area_sqft,
        furnishing,floor,total_floors,parking,balcony,amenities,address,locality,city,latitude,
        longitude,available_from,status,quality_score,freshness_score
      ) values (
        ${propertyId},${uuid('1', ((index - 1) % 20) + 1)},${uuid('0', localityIndex + 1)},
        ${`${bhk} BHK home in ${locality}`},${`Fictional development listing ${index} for local testing.`},
        'apartment',${bhk},${rent},${rent * 2},${area},${area},${furnishing},${floor},12,
        ${parking},${balcony},${JSON.stringify(amenities)}::jsonb,${`Demo address ${index}, ${locality}`},
        ${locality},'Bengaluru',${propertyLatitude},${propertyLongitude},${availableFrom}::date,
        'ACTIVE',${quality},${freshness}
      )
      on conflict (id) do update set
        broker_id=excluded.broker_id, location_id=excluded.location_id, title=excluded.title,
        description=excluded.description, property_type=excluded.property_type, bhk=excluded.bhk,
        rent=excluded.rent, deposit=excluded.deposit, area=excluded.area, area_sqft=excluded.area_sqft,
        furnishing=excluded.furnishing, floor=excluded.floor, total_floors=excluded.total_floors,
        parking=excluded.parking, balcony=excluded.balcony, amenities=excluded.amenities,
        address=excluded.address, locality=excluded.locality, city=excluded.city,
        latitude=excluded.latitude, longitude=excluded.longitude, available_from=excluded.available_from,
        status=excluded.status, quality_score=excluded.quality_score,
        freshness_score=excluded.freshness_score, updated_at=now()
      where (properties.broker_id,properties.location_id,properties.title,properties.description,
        properties.property_type,properties.bhk,properties.rent,properties.deposit,properties.area,
        properties.area_sqft,properties.furnishing,properties.floor,properties.total_floors,
        properties.parking,properties.balcony,properties.amenities,properties.address,
        properties.locality,properties.city,properties.latitude,properties.longitude,
        properties.available_from,properties.status,properties.quality_score,properties.freshness_score)
        is distinct from (excluded.broker_id,excluded.location_id,excluded.title,excluded.description,
        excluded.property_type,excluded.bhk,excluded.rent,excluded.deposit,excluded.area,
        excluded.area_sqft,excluded.furnishing,excluded.floor,excluded.total_floors,
        excluded.parking,excluded.balcony,excluded.amenities,excluded.address,
        excluded.locality,excluded.city,excluded.latitude,excluded.longitude,
        excluded.available_from,excluded.status,excluded.quality_score,excluded.freshness_score)
      returning (xmax = 0) inserted
    `.execute(trx);
    const row = result.rows[0];
    increment(
      stats,
      'properties',
      row ? (row.inserted ? 'Inserted' : 'Updated') : 'Skipped',
    );

    const image = await sql<{ inserted: boolean }>`
      insert into property_images (id,property_id,storage_path,sort_order)
      values (${uuid('3', index)},${propertyId},${`placeholders/properties/${String(index).padStart(3, '0')}.webp`},0)
      on conflict (property_id,sort_order) do update set
        id=excluded.id, storage_path=excluded.storage_path
      where (property_images.id,property_images.storage_path)
        is distinct from (excluded.id,excluded.storage_path)
      returning (xmax = 0) inserted
    `.execute(trx);
    const imageRow = image.rows[0];
    increment(
      stats,
      'propertyImages',
      imageRow ? (imageRow.inserted ? 'Inserted' : 'Updated') : 'Skipped',
    );
  }
}

export async function seedDatabase(): Promise<SeedStats> {
  const database = createDatabase(readDatabaseConfig(process.env, 'migration'));
  const stats: MutableSeedStats = {
    locationsInserted: 0,
    locationsUpdated: 0,
    locationsSkipped: 0,
    brokersInserted: 0,
    brokersUpdated: 0,
    brokersSkipped: 0,
    propertiesInserted: 0,
    propertiesUpdated: 0,
    propertiesSkipped: 0,
    propertyImagesInserted: 0,
    propertyImagesUpdated: 0,
    propertyImagesSkipped: 0,
  };
  try {
    await database.transaction().execute(async (trx) => {
      await seedLocations(trx, stats);
      await seedBrokers(trx, stats);
      await seedProperties(trx, stats);
    });
  } finally {
    await database.destroy();
  }
  const result: SeedStats = {
    ...stats,
    inserted:
      stats.locationsInserted +
      stats.brokersInserted +
      stats.propertiesInserted +
      stats.propertyImagesInserted,
    updated:
      stats.locationsUpdated +
      stats.brokersUpdated +
      stats.propertiesUpdated +
      stats.propertyImagesUpdated,
    skipped:
      stats.locationsSkipped +
      stats.brokersSkipped +
      stats.propertiesSkipped +
      stats.propertyImagesSkipped,
  };
  console.log(JSON.stringify(result));
  return result;
}
