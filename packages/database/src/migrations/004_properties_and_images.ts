import { sql, type Kysely } from 'kysely';
export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    create table properties (
      id uuid primary key default gen_random_uuid(), broker_id uuid not null references brokers(id) on delete restrict,
      title text not null, description text not null, property_type property_type not null, bhk smallint not null check (bhk between 0 and 20),
      rent numeric(12,2) not null check (rent >= 0), deposit numeric(12,2) check (deposit >= 0), area_sqft numeric(10,2) not null check (area_sqft > 0),
      furnishing furnishing_type not null, floor smallint, total_floors smallint check (total_floors >= 0), parking boolean not null default false,
      balcony smallint not null default 0 check (balcony >= 0), amenities jsonb not null default '[]', address text not null, locality citext not null, city citext not null,
      latitude numeric(9,6) not null check (latitude between -90 and 90), longitude numeric(9,6) not null check (longitude between -180 and 180),
      location geography(point,4326) generated always as (st_setsrid(st_makepoint(longitude::double precision, latitude::double precision),4326)::geography) stored,
      available_from date not null, status property_status not null default 'DRAFT', quality_score numeric(5,2) not null default 0 check (quality_score between 0 and 100),
      freshness_score numeric(5,2) not null default 0 check (freshness_score between 0 and 100), embedding vector(1536),
      created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
      constraint property_floor_order check (floor is null or total_floors is null or floor <= total_floors)
    );
    comment on column properties.embedding is 'Nullable 1536-dimensional embedding; generation and semantic search are deferred.';
    create table property_images (
      id uuid primary key default gen_random_uuid(), property_id uuid not null references properties(id) on delete cascade,
      storage_path text not null, public_url_or_signed_url text, sort_order integer not null check (sort_order >= 0),
      width integer check (width > 0), height integer check (height > 0), created_at timestamptz not null default now(), unique(property_id, sort_order)
    );
  `.execute(db);
}
export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`drop table if exists property_images, properties cascade`.execute(
    db,
  );
}
