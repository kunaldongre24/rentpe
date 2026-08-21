import { sql, type Kysely } from 'kysely';
export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    create table call_sessions (
      id uuid primary key default gen_random_uuid(), user_id uuid not null references users(id) on delete cascade, provider text not null,
      provider_call_id text not null unique, started_at timestamptz not null, ended_at timestamptz, duration_seconds integer check (duration_seconds >= 0),
      status call_status not null, transcript_reference text, created_at timestamptz not null default now()
    );
    create table conversation_events (
      id uuid primary key default gen_random_uuid(), call_session_id uuid references call_sessions(id) on delete cascade,
      user_id uuid not null references users(id) on delete cascade, search_id uuid references property_searches(id) on delete set null,
      event_type text not null, role text, content text, metadata jsonb not null default '{}', occurred_at timestamptz not null default now(), created_at timestamptz not null default now()
    );
    create table property_feedback (
      id uuid primary key default gen_random_uuid(), user_id uuid not null references users(id) on delete cascade,
      search_id uuid not null references property_searches(id) on delete cascade, property_id uuid references properties(id) on delete set null,
      feedback_type text not null, feedback_text text, structured_feedback jsonb not null default '{}', created_at timestamptz not null default now()
    );
    create table behavioral_preferences (
      id uuid primary key default gen_random_uuid(), user_id uuid not null references users(id) on delete cascade,
      search_id uuid references property_searches(id) on delete cascade, preference_key text not null, value jsonb not null,
      confidence numeric(4,3) not null check (confidence between 0 and 1), evidence_count integer not null default 1 check (evidence_count > 0),
      source requirement_source not null default 'behavioral', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
    );
    create unique index behavioral_preferences_scope_unique on behavioral_preferences(user_id, coalesce(search_id, '00000000-0000-0000-0000-000000000000'::uuid), preference_key);
    create table property_notifications (
      id uuid primary key default gen_random_uuid(), user_id uuid not null references users(id) on delete cascade,
      search_id uuid not null references property_searches(id) on delete cascade, property_id uuid not null references properties(id) on delete cascade,
      channel notification_channel not null, status notification_status not null default 'pending', sent_at timestamptz, created_at timestamptz not null default now(),
      unique(user_id, search_id, property_id, channel)
    );
  `.execute(db);
}
export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`drop table if exists property_notifications, behavioral_preferences, property_feedback, conversation_events, call_sessions cascade`.execute(
    db,
  );
}
