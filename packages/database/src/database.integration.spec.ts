import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { sql, type Kysely } from 'kysely';
import { createDatabase } from './client.js';
import { readDatabaseConfig } from './config.js';
import type { Database } from './types.js';
import { seedDatabase } from './seed.js';

const enabled = Boolean(process.env.DATABASE_URL);
const requiredTables = [
  'users',
  'locations',
  'brokers',
  'property_searches',
  'search_requirements',
  'properties',
  'property_images',
  'call_sessions',
  'conversation_events',
  'property_feedback',
  'behavioral_preferences',
  'property_notifications',
];
const expectedEnums: Record<string, string[]> = {
  call_status: ['started', 'completed', 'failed', 'abandoned'],
  furnishing_type: ['unfurnished', 'semi_furnished', 'fully_furnished'],
  notification_channel: ['whatsapp'],
  notification_status: ['pending', 'sent', 'failed', 'cancelled'],
  preference_type: ['required', 'preferred', 'flexible', 'excluded'],
  property_status: [
    'DRAFT',
    'ACTIVE',
    'PAUSED',
    'RENTED',
    'EXPIRED',
    'DELETED',
  ],
  property_type: ['apartment', 'independent_house', 'villa', 'studio'],
  requirement_source: ['explicit', 'inferred', 'system', 'behavioral'],
  search_status: ['ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED', 'EXPIRED'],
  verification_status: ['unverified', 'pending', 'verified', 'rejected'],
};
const requiredEnums = Object.keys(expectedEnums);
const requiredIndexes = [
  'users_normalized_phone_unique',
  'locations_city_name_idx',
  'locations_location_gist',
  'brokers_normalized_phone_unique',
  'brokers_active_verification_idx',
  'properties_location_gist',
  'properties_city_bhk_rent_idx',
  'properties_city_status_idx',
  'properties_locality_status_idx',
  'properties_available_from_idx',
  'properties_broker_idx',
  'properties_location_id_idx',
  'property_searches_user_status_idx',
  'property_searches_expires_at_idx',
  'property_searches_available_from_idx',
  'conversation_events_user_search_idx',
  'property_feedback_search_property_idx',
  'property_feedback_user_idx',
  'property_notifications_user_search_idx',
  'property_notifications_lookup_idx',
];

describe.runIf(enabled)('database schema integration', () => {
  let db: Kysely<Database>;

  beforeAll(() => {
    db = createDatabase(readDatabaseConfig(process.env));
  });

  afterAll(async () => {
    await db.destroy();
  });

  it('uses PostgreSQL 15 and installs every required extension', async () => {
    const server = await sql<{
      version: string;
    }>`select current_setting('server_version') version`.execute(db);
    expect(server.rows[0]?.version).toMatch(/^15\./);
    const extensions = await sql<{ extname: string }>`
      select extname from pg_extension
      where extname in ('postgis','vector','citext','pgcrypto')
      order by extname
    `.execute(db);
    expect(extensions.rows.map((row) => row.extname)).toEqual([
      'citext',
      'pgcrypto',
      'postgis',
      'vector',
    ]);
  });

  it('contains the complete table and enum contract', async () => {
    const tables = await sql<{ table_name: string }>`
      select table_name from information_schema.tables
      where table_schema = 'public' and table_type = 'BASE TABLE'
    `.execute(db);
    expect(tables.rows.map((row) => row.table_name)).toEqual(
      expect.arrayContaining(requiredTables),
    );

    const enums = await sql<{ typname: string; enumlabel: string }>`
      select t.typname, e.enumlabel
      from pg_type t join pg_enum e on e.enumtypid = t.oid
      where t.typname in ('search_status','property_status','furnishing_type','property_type','requirement_source','preference_type','verification_status','call_status','notification_channel','notification_status')
      order by t.typname, e.enumsortorder
    `.execute(db);
    expect(new Set(enums.rows.map((row) => row.typname))).toEqual(
      new Set(requiredEnums),
    );
    for (const [name, values] of Object.entries(expectedEnums))
      expect(
        enums.rows
          .filter((row) => row.typname === name)
          .map((row) => row.enumlabel),
      ).toEqual(values);
  });

  it('uses UUID primary keys, canonical phone fields, typed requirements, and timestamps', async () => {
    const primaryKeys = await sql<{
      table_name: string;
      udt_name: string;
      column_default: string | null;
    }>`
      select c.relname table_name, a.udt_name, a.column_default
      from pg_constraint k
      join pg_class c on c.oid = k.conrelid
      join information_schema.columns a
        on a.table_schema = 'public' and a.table_name = c.relname and a.column_name = 'id'
      where k.contype = 'p'
    `.execute(db);
    for (const table of requiredTables)
      expect(primaryKeys.rows).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            table_name: table,
            udt_name: 'uuid',
            column_default: 'gen_random_uuid()',
          }),
        ]),
      );

    const columns = await sql<{
      table_name: string;
      column_name: string;
      data_type: string;
      udt_name: string;
    }>`
      select table_name, column_name, data_type, udt_name
      from information_schema.columns
      where table_schema = 'public'
        and (column_name in ('created_at','updated_at','occurred_at','started_at','ended_at','sent_at','expires_at')
          or (table_name = 'properties' and column_name = 'embedding'))
    `.execute(db);
    expect(
      columns.rows
        .filter((row) => row.column_name !== 'embedding')
        .every((row) => row.data_type === 'timestamp with time zone'),
    ).toBe(true);
    expect(
      columns.rows.filter((row) => row.column_name !== 'embedding'),
    ).toHaveLength(23);
    const timestampWithoutTimeZone = await sql<{ count: string }>`
      select count(*)::text count from information_schema.columns
      where table_schema = 'public' and data_type = 'timestamp without time zone'
    `.execute(db);
    expect(timestampWithoutTimeZone.rows[0]?.count).toBe('0');
    const phoneColumns = await sql<{
      table_name: string;
      column_name: string;
      udt_name: string;
    }>`
      select table_name, column_name, udt_name from information_schema.columns
      where table_schema = 'public' and column_name = 'normalized_phone'
    `.execute(db);
    expect(phoneColumns.rows).toEqual(
      expect.arrayContaining([
        {
          table_name: 'users',
          column_name: 'normalized_phone',
          udt_name: 'citext',
        },
        {
          table_name: 'brokers',
          column_name: 'normalized_phone',
          udt_name: 'citext',
        },
      ]),
    );
    const citextColumns = await sql<{
      table_name: string;
      column_name: string;
    }>`
      select table_name, column_name from information_schema.columns
      where table_schema = 'public' and udt_name = 'citext'
    `.execute(db);
    expect(citextColumns.rows).toEqual(
      expect.arrayContaining([
        { table_name: 'locations', column_name: 'normalized_name' },
        { table_name: 'locations', column_name: 'city' },
        { table_name: 'property_searches', column_name: 'city' },
        { table_name: 'properties', column_name: 'locality' },
        { table_name: 'properties', column_name: 'city' },
      ]),
    );
    const requirementColumns = await sql<{ column_name: string }>`
      select column_name from information_schema.columns
      where table_schema = 'public' and table_name = 'search_requirements'
    `.execute(db);
    expect(requirementColumns.rows.map((row) => row.column_name)).toEqual(
      expect.arrayContaining([
        'value_text',
        'value_number',
        'value_boolean',
        'value_json',
      ]),
    );
  });

  it('contains the required foreign keys and delete actions', async () => {
    const foreignKeys = await sql<{
      table_name: string;
      column_name: string;
      referenced_table: string;
      delete_rule: string;
    }>`
      select tc.table_name, kcu.column_name, ccu.table_name referenced_table, rc.delete_rule
      from information_schema.table_constraints tc
      join information_schema.key_column_usage kcu using (constraint_name, table_schema)
      join information_schema.constraint_column_usage ccu using (constraint_name, table_schema)
      join information_schema.referential_constraints rc
        on rc.constraint_name = tc.constraint_name and rc.constraint_schema = tc.table_schema
      where tc.constraint_type = 'FOREIGN KEY' and tc.table_schema = 'public'
    `.execute(db);
    expect(foreignKeys.rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          table_name: 'property_searches',
          column_name: 'user_id',
          referenced_table: 'users',
          delete_rule: 'CASCADE',
        }),
        expect.objectContaining({
          table_name: 'search_requirements',
          column_name: 'search_id',
          referenced_table: 'property_searches',
          delete_rule: 'CASCADE',
        }),
        expect.objectContaining({
          table_name: 'properties',
          column_name: 'broker_id',
          referenced_table: 'brokers',
          delete_rule: 'RESTRICT',
        }),
        expect.objectContaining({
          table_name: 'properties',
          column_name: 'location_id',
          referenced_table: 'locations',
          delete_rule: 'RESTRICT',
        }),
        expect.objectContaining({
          table_name: 'property_images',
          column_name: 'property_id',
          referenced_table: 'properties',
          delete_rule: 'CASCADE',
        }),
        expect.objectContaining({
          table_name: 'call_sessions',
          column_name: 'user_id',
          referenced_table: 'users',
          delete_rule: 'CASCADE',
        }),
        expect.objectContaining({
          table_name: 'conversation_events',
          column_name: 'call_session_id',
          referenced_table: 'call_sessions',
          delete_rule: 'CASCADE',
        }),
        expect.objectContaining({
          table_name: 'conversation_events',
          column_name: 'user_id',
          referenced_table: 'users',
          delete_rule: 'CASCADE',
        }),
        expect.objectContaining({
          table_name: 'conversation_events',
          column_name: 'search_id',
          referenced_table: 'property_searches',
          delete_rule: 'SET NULL',
        }),
        expect.objectContaining({
          table_name: 'property_feedback',
          column_name: 'user_id',
          referenced_table: 'users',
          delete_rule: 'CASCADE',
        }),
        expect.objectContaining({
          table_name: 'property_feedback',
          column_name: 'search_id',
          referenced_table: 'property_searches',
          delete_rule: 'CASCADE',
        }),
        expect.objectContaining({
          table_name: 'property_feedback',
          column_name: 'property_id',
          referenced_table: 'properties',
          delete_rule: 'SET NULL',
        }),
        expect.objectContaining({
          table_name: 'behavioral_preferences',
          column_name: 'user_id',
          referenced_table: 'users',
          delete_rule: 'CASCADE',
        }),
        expect.objectContaining({
          table_name: 'behavioral_preferences',
          column_name: 'search_id',
          referenced_table: 'property_searches',
          delete_rule: 'CASCADE',
        }),
        expect.objectContaining({
          table_name: 'property_notifications',
          column_name: 'user_id',
          referenced_table: 'users',
          delete_rule: 'CASCADE',
        }),
        expect.objectContaining({
          table_name: 'property_notifications',
          column_name: 'search_id',
          referenced_table: 'property_searches',
          delete_rule: 'CASCADE',
        }),
        expect.objectContaining({
          table_name: 'property_notifications',
          column_name: 'property_id',
          referenced_table: 'properties',
          delete_rule: 'CASCADE',
        }),
      ]),
    );
  });

  it('contains the complete named check-constraint contract', async () => {
    const checks = await sql<{ constraint_name: string }>`
      select constraint_name from information_schema.table_constraints
      where table_schema = 'public' and constraint_type = 'CHECK'
    `.execute(db);
    expect(checks.rows.map((row) => row.constraint_name)).toEqual(
      expect.arrayContaining([
        'users_phone_sanity',
        'users_canonical_phone_sanity',
        'users_normalized_phone_sanity',
        'users_whatsapp_phone_sanity',
        'locations_latitude_check',
        'locations_longitude_check',
        'locations_aliases_array',
        'brokers_phone_sanity',
        'brokers_response_rate_check',
        'brokers_response_time_minutes_check',
        'brokers_quality_score_check',
        'brokers_response_score_range',
        'property_searches_intent_check',
        'property_searches_bhk_check',
        'property_searches_min_budget_check',
        'property_searches_max_budget_check',
        'property_searches_latitude_check',
        'property_searches_longitude_check',
        'property_searches_search_radius_meters_check',
        'search_budget_order',
        'property_searches_rent_order',
        'property_searches_area_order',
        'property_searches_min_rent_nonnegative',
        'property_searches_max_rent_nonnegative',
        'property_searches_min_area_positive',
        'property_searches_max_area_positive',
        'property_searches_bhk_positive',
        'search_requirements_confidence_check',
        'search_requirements_one_typed_value',
        'properties_bhk_check',
        'properties_rent_check',
        'properties_deposit_check',
        'properties_area_sqft_check',
        'properties_total_floors_check',
        'properties_balcony_check',
        'properties_latitude_check',
        'properties_longitude_check',
        'properties_quality_score_check',
        'properties_freshness_score_check',
        'property_floor_order',
        'properties_area_positive',
        'properties_bhk_positive',
        'properties_floor_valid',
        'properties_amenities_array',
        'property_images_sort_order_check',
        'property_images_width_check',
        'property_images_height_check',
        'call_sessions_duration_seconds_check',
        'conversation_events_speaker_check',
        'property_feedback_feedback_type_check',
        'behavioral_preferences_confidence_check',
        'behavioral_preferences_evidence_count_check',
      ]),
    );
  });

  it('contains all filtering, spatial, and delivery indexes without a vector index', async () => {
    const indexes = await sql<{
      indexname: string;
    }>`select indexname from pg_indexes where schemaname = 'public'`.execute(
      db,
    );
    const names = indexes.rows.map((row) => row.indexname);
    expect(names).toEqual(expect.arrayContaining(requiredIndexes));
    const spatialIndexes = await sql<{ indexname: string; indexdef: string }>`
      select indexname, indexdef from pg_indexes
      where schemaname = 'public' and indexname in ('locations_location_gist','properties_location_gist')
    `.execute(db);
    expect(spatialIndexes.rows).toHaveLength(2);
    expect(
      spatialIndexes.rows.every((row) => /using gist/i.test(row.indexdef)),
    ).toBe(true);
    expect(names).toEqual(
      expect.arrayContaining([
        'users_phone_number_key',
        'locations_normalized_name_key',
        'brokers_phone_number_key',
        'search_requirements_search_id_requirement_key_key',
        'property_images_property_id_sort_order_key',
        'call_sessions_provider_call_id_key',
        'behavioral_preferences_scope_unique',
        'property_notifications_user_id_search_id_property_id_channel_key',
      ]),
    );
    expect(
      names.some(
        (name) => name.includes('embedding') || name.includes('vector'),
      ),
    ).toBe(false);

    const notificationUnique = await sql<{ columns: string[] }>`
      select array_agg(a.attname order by keys.ordinality)::text[] columns
      from pg_constraint c
      join lateral unnest(c.conkey) with ordinality keys(attnum, ordinality) on true
      join pg_attribute a on a.attrelid = c.conrelid and a.attnum = keys.attnum
      where c.conrelid = 'property_notifications'::regclass and c.contype = 'u'
      group by c.oid
    `.execute(db);
    expect(notificationUnique.rows).toEqual([
      { columns: ['user_id', 'search_id', 'property_id', 'channel'] },
    ]);
  });

  it('uses PostGIS geography SRID 4326 and vector(1536)', async () => {
    const geography = await sql<{ table_name: string; formatted_type: string }>`
      select c.relname table_name, format_type(a.atttypid, a.atttypmod) formatted_type
      from pg_attribute a join pg_class c on c.oid = a.attrelid
      where c.relname in ('locations','properties','property_searches') and a.attname = 'location' and not a.attisdropped
    `.execute(db);
    expect(geography.rows).toEqual(
      expect.arrayContaining([
        { table_name: 'locations', formatted_type: 'geography(Point,4326)' },
        { table_name: 'properties', formatted_type: 'geography(Point,4326)' },
        {
          table_name: 'property_searches',
          formatted_type: 'geography(Point,4326)',
        },
      ]),
    );
    const vector = await sql<{ formatted_type: string }>`
      select format_type(a.atttypid, a.atttypmod) formatted_type
      from pg_attribute a join pg_class c on c.oid = a.attrelid
      where c.relname = 'properties' and a.attname = 'embedding'
    `.execute(db);
    expect(vector.rows[0]?.formatted_type).toBe('vector(1536)');
  });

  it('reports unchanged seed rows as skipped and changed rows as updated', async () => {
    const unchanged = await seedDatabase();
    expect(unchanged).toMatchObject({
      inserted: 0,
      updated: 0,
      skipped: 270,
      locationsSkipped: 10,
      brokersSkipped: 20,
      propertiesSkipped: 120,
      propertyImagesSkipped: 120,
    });

    await sql`update brokers set name = 'Deliberately changed by integration test' where id = '10000000-0000-4000-8000-000000000001'`.execute(
      db,
    );
    const repaired = await seedDatabase();
    expect(repaired).toMatchObject({
      inserted: 0,
      updated: 1,
      skipped: 269,
      brokersUpdated: 1,
      brokersSkipped: 19,
      locationsSkipped: 10,
      propertiesSkipped: 120,
      propertyImagesSkipped: 120,
    });
  });

  it('has deterministic seed counts and enforces representative checks', async () => {
    const totals = await sql<{
      locations: string;
      brokers: string;
      properties: string;
      images: string;
      embeddings: string;
    }>`
      select (select count(*) from locations)::text locations,
        (select count(*) from brokers)::text brokers,
        (select count(*) from properties)::text properties,
        (select count(*) from property_images)::text images,
        (select count(embedding) from properties)::text embeddings
    `.execute(db);
    expect(totals.rows[0]).toEqual({
      locations: '10',
      brokers: '20',
      properties: '120',
      images: '120',
      embeddings: '0',
    });
    await expect(
      sql`insert into brokers (name,phone,normalized_phone,phone_number,response_rate,response_score,quality_score) values ('Invalid','+919999999999','+919999999999','+919999999999',101,101,50)`.execute(
        db,
      ),
    ).rejects.toThrow();
    await expect(
      sql`insert into properties (broker_id,location_id,title,description,property_type,bhk,rent,area,area_sqft,furnishing,address,locality,city,latitude,longitude,available_from) select id,(select id from locations limit 1),'Invalid','Invalid','apartment',2,-1,1000,1000,'unfurnished','x','x','Bengaluru',0,0,current_date from brokers limit 1`.execute(
        db,
      ),
    ).rejects.toThrow();
  });
});
