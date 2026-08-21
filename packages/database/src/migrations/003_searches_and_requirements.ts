import { sql, type Kysely } from 'kysely';
export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    create table property_searches (
      id uuid primary key default gen_random_uuid(), user_id uuid not null references users(id) on delete cascade,
      intent text not null default 'rent' check (intent = 'rent'), status search_status not null default 'ACTIVE', city citext not null, locality citext,
      property_type property_type, bhk smallint check (bhk between 0 and 20), min_budget numeric(12,2) check (min_budget >= 0), max_budget numeric(12,2) check (max_budget >= 0),
      furnishing furnishing_type, move_in_date date, latitude numeric(9,6) check (latitude between -90 and 90), longitude numeric(9,6) check (longitude between -180 and 180),
      location geography(point,4326), search_radius_meters integer check (search_radius_meters > 0), created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(), expires_at timestamptz, constraint search_budget_order check (min_budget is null or max_budget is null or min_budget <= max_budget)
    );
    create table search_requirements (
      id uuid primary key default gen_random_uuid(), search_id uuid not null references property_searches(id) on delete cascade,
      requirement_key text not null, value jsonb not null, confidence numeric(4,3) not null check (confidence between 0 and 1),
      source requirement_source not null, preference_type preference_type not null, updated_at timestamptz not null default now(), unique(search_id, requirement_key)
    );
  `.execute(db);
}
export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`drop table if exists search_requirements, property_searches cascade`.execute(
    db,
  );
}
