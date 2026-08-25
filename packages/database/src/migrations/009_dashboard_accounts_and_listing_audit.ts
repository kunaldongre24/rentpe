import { sql, type Kysely } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    create type dashboard_role as enum ('ADMIN', 'BROKER', 'OWNER');
    create type dashboard_account_status as enum ('INVITED', 'ACTIVE', 'SUSPENDED');

    create table dashboard_accounts (
      id uuid primary key default gen_random_uuid(),
      auth_user_id uuid not null unique,
      email citext not null unique,
      display_name text,
      phone varchar(20),
      role dashboard_role not null,
      status dashboard_account_status not null default 'INVITED',
      broker_id uuid references brokers(id) on delete restrict,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      constraint dashboard_accounts_partner_broker_check check (
        role = 'ADMIN' or broker_id is not null
      )
    );

    create table listing_audit_events (
      id uuid primary key default gen_random_uuid(),
      property_id uuid not null references properties(id) on delete cascade,
      actor_account_id uuid not null references dashboard_accounts(id) on delete restrict,
      action text not null,
      previous_status property_status,
      new_status property_status,
      metadata jsonb not null default '{}',
      created_at timestamptz not null default now()
    );

    create index dashboard_accounts_role_status_idx on dashboard_accounts(role, status);
    create index dashboard_accounts_broker_idx on dashboard_accounts(broker_id) where broker_id is not null;
    create index listing_audit_property_created_idx on listing_audit_events(property_id, created_at desc);
    create index listing_audit_actor_created_idx on listing_audit_events(actor_account_id, created_at desc);
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`
    drop table if exists listing_audit_events, dashboard_accounts cascade;
    drop type if exists dashboard_account_status, dashboard_role;
  `.execute(db);
}
