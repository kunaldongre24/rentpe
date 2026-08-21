import { sql, type Kysely } from 'kysely';
export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    create index locations_location_gist on locations using gist(location);
    create index brokers_active_verification_idx on brokers(active, verification_status);
    create index property_searches_user_status_idx on property_searches(user_id, status);
    create index property_searches_expires_at_idx on property_searches(expires_at) where expires_at is not null;
    create index properties_city_status_idx on properties(city, status);
    create index properties_city_bhk_rent_idx on properties(city, bhk, rent);
    create index properties_locality_status_idx on properties(locality, status);
    create index properties_available_from_idx on properties(available_from);
    create index properties_broker_idx on properties(broker_id);
    create index properties_location_gist on properties using gist(location);
    create index conversation_events_user_search_idx on conversation_events(user_id, search_id, occurred_at desc);
    create index property_feedback_search_property_idx on property_feedback(search_id, property_id, created_at desc);
    create index property_notifications_user_search_idx on property_notifications(user_id, search_id, created_at desc);
  `.execute(db);
}
export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`drop index if exists property_notifications_user_search_idx, property_feedback_search_property_idx, conversation_events_user_search_idx, properties_location_gist, properties_broker_idx, properties_available_from_idx, properties_locality_status_idx, properties_city_bhk_rent_idx, properties_city_status_idx, property_searches_expires_at_idx, property_searches_user_status_idx, brokers_active_verification_idx, locations_location_gist`.execute(
    db,
  );
}
