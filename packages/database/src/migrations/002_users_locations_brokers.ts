import { sql, type Kysely } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    create table users (
      id uuid primary key default gen_random_uuid(), phone_number varchar(20) not null unique,
      name text, whatsapp_number varchar(20), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
      constraint users_phone_sanity check (length(phone_number) between 8 and 20)
    );
    create table locations (
      id uuid primary key default gen_random_uuid(), country citext not null, state citext not null, city citext not null,
      locality citext not null, normalized_name citext not null unique, aliases jsonb not null default '[]',
      latitude numeric(9,6) not null check (latitude between -90 and 90), longitude numeric(9,6) not null check (longitude between -180 and 180),
      location geography(point,4326) generated always as (st_setsrid(st_makepoint(longitude::double precision, latitude::double precision),4326)::geography) stored,
      created_at timestamptz not null default now(), updated_at timestamptz not null default now()
    );
    create table brokers (
      id uuid primary key default gen_random_uuid(), name text not null, phone_number varchar(20) not null unique, company text,
      verification_status verification_status not null default 'unverified', response_rate numeric(5,2) not null default 0 check (response_rate between 0 and 100),
      response_time_minutes integer check (response_time_minutes >= 0), quality_score numeric(5,2) not null default 0 check (quality_score between 0 and 100),
      active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
      constraint brokers_phone_sanity check (length(phone_number) between 8 and 20)
    );
  `.execute(db);
}
export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`drop table if exists brokers, locations, users cascade`.execute(db);
}
