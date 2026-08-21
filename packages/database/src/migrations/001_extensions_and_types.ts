import { sql, type Kysely } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`create extension if not exists postgis`.execute(db);
  await sql`create extension if not exists vector`.execute(db);
  await sql`create extension if not exists citext`.execute(db);
  await sql`create extension if not exists pgcrypto`.execute(db);
  await sql`
    create type search_status as enum ('ACTIVE','PAUSED','COMPLETED','CANCELLED','EXPIRED');
    create type property_status as enum ('DRAFT','ACTIVE','PAUSED','RENTED','EXPIRED','DELETED');
    create type furnishing_type as enum ('unfurnished','semi_furnished','fully_furnished');
    create type property_type as enum ('apartment','independent_house','villa','studio');
    create type requirement_source as enum ('explicit','inferred','system','behavioral');
    create type preference_type as enum ('required','preferred','flexible','excluded');
    create type verification_status as enum ('unverified','pending','verified','rejected');
    create type call_status as enum ('started','completed','failed','abandoned');
    create type notification_channel as enum ('whatsapp');
    create type notification_status as enum ('pending','sent','failed','cancelled');
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`drop type if exists notification_status, notification_channel, call_status, verification_status, preference_type, requirement_source, property_type, furnishing_type, property_status, search_status`.execute(
    db,
  );
  await sql`drop extension if exists vector, postgis, citext, pgcrypto`.execute(
    db,
  );
}
