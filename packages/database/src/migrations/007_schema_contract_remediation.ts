import { sql, type Kysely } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    alter table users
      add column if not exists phone text,
      add column if not exists normalized_phone citext;
    update users set phone = phone_number where phone is null;
    update users set normalized_phone = lower(phone_number) where normalized_phone is null;
    alter table users alter column phone set not null, alter column normalized_phone set not null;
    alter table users add constraint users_canonical_phone_sanity check (length(phone) between 8 and 20);
    alter table users add constraint users_normalized_phone_sanity check (length(normalized_phone::text) between 8 and 20);
    alter table users add constraint users_whatsapp_phone_sanity check (whatsapp_number is null or length(whatsapp_number) between 8 and 20);
    create unique index if not exists users_normalized_phone_unique on users(normalized_phone);

    alter table locations add column if not exists name text;
    update locations set name = locality::text where name is null;
    alter table locations alter column name set not null;
    alter table locations add constraint locations_aliases_array check (jsonb_typeof(aliases) = 'array');
    create index if not exists locations_city_name_idx on locations(city, name);

    alter table brokers
      add column if not exists phone text,
      add column if not exists normalized_phone citext,
      add column if not exists response_score numeric(5,2);
    update brokers set phone = phone_number where phone is null;
    update brokers set normalized_phone = lower(phone_number) where normalized_phone is null;
    update brokers set response_score = response_rate where response_score is null;
    alter table brokers alter column phone set not null, alter column normalized_phone set not null, alter column response_score set not null;
    alter table brokers add constraint brokers_canonical_phone_sanity check (length(phone) between 8 and 20);
    alter table brokers add constraint brokers_normalized_phone_sanity check (length(normalized_phone::text) between 8 and 20);
    alter table brokers add constraint brokers_response_score_range check (response_score between 0 and 100);
    create unique index if not exists brokers_normalized_phone_unique on brokers(normalized_phone);

    alter table properties
      add column if not exists location_id uuid,
      add column if not exists area numeric(10,2);
    update properties p set location_id = l.id from locations l where p.location_id is null and l.city = p.city and l.locality = p.locality;
    update properties set area = area_sqft where area is null;
    alter table properties alter column location_id set not null, alter column area set not null;
    alter table properties add constraint properties_location_id_fkey foreign key (location_id) references locations(id) on delete restrict;
    alter table properties add constraint properties_area_positive check (area > 0);
    alter table properties add constraint properties_bhk_positive check (bhk between 1 and 20);
    alter table properties add constraint properties_floor_valid check (floor is null or floor >= 0);
    alter table properties add constraint properties_amenities_array check (jsonb_typeof(amenities) = 'array');
    create index if not exists properties_location_id_idx on properties(location_id);

    alter table property_searches
      add column if not exists min_rent numeric(12,2),
      add column if not exists max_rent numeric(12,2),
      add column if not exists min_area numeric(10,2),
      add column if not exists max_area numeric(10,2),
      add column if not exists available_from date;
    update property_searches set min_rent = min_budget where min_rent is null;
    update property_searches set max_rent = max_budget where max_rent is null;
    update property_searches set available_from = move_in_date where available_from is null;
    alter table property_searches
      add constraint property_searches_rent_order check (min_rent is null or max_rent is null or min_rent <= max_rent),
      add constraint property_searches_area_order check (min_area is null or max_area is null or min_area <= max_area),
      add constraint property_searches_min_rent_nonnegative check (min_rent is null or min_rent >= 0),
      add constraint property_searches_max_rent_nonnegative check (max_rent is null or max_rent >= 0),
      add constraint property_searches_min_area_positive check (min_area is null or min_area > 0),
      add constraint property_searches_max_area_positive check (max_area is null or max_area > 0),
      add constraint property_searches_bhk_positive check (bhk is null or bhk between 1 and 20);
    create index if not exists property_searches_available_from_idx on property_searches(available_from);

    alter table search_requirements
      add column if not exists value_text text,
      add column if not exists value_number numeric,
      add column if not exists value_boolean boolean,
      add column if not exists value_json jsonb;
    update search_requirements set value_json = value where value_json is null;
    alter table search_requirements alter column value drop not null;
    alter table search_requirements add constraint search_requirements_one_typed_value check (num_nonnulls(value_text,value_number,value_boolean,value_json) = 1);

    alter table call_sessions add column if not exists metadata jsonb not null default '{}';

    alter table conversation_events
      add column if not exists speaker text,
      add column if not exists transcript text,
      add column if not exists structured_data jsonb;
    update conversation_events set speaker = case role when 'user' then 'user' when 'assistant' then 'assistant' when 'system' then 'system' else 'tool' end where speaker is null;
    update conversation_events set transcript = coalesce(content, '') where transcript is null;
    update conversation_events set structured_data = metadata where structured_data is null;
    alter table conversation_events alter column speaker set not null, alter column transcript set not null, alter column structured_data set not null;
    alter table conversation_events add constraint conversation_events_speaker_check check (speaker in ('user','assistant','system','tool'));

    alter table property_feedback drop constraint if exists property_feedback_feedback_type_check;
    alter table property_feedback add constraint property_feedback_feedback_type_check check (feedback_type in ('liked','disliked','shortlisted','contacted','rejected','ignored','opened'));
    create index if not exists property_feedback_user_idx on property_feedback(user_id, created_at desc);

    create index if not exists property_notifications_lookup_idx on property_notifications(user_id, search_id, property_id, channel);
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`
    drop index if exists property_feedback_user_idx, property_searches_available_from_idx, properties_location_id_idx, brokers_normalized_phone_unique, locations_city_name_idx, users_normalized_phone_unique;
    alter table property_feedback drop constraint if exists property_feedback_feedback_type_check;
    alter table conversation_events drop constraint if exists conversation_events_speaker_check, drop column if exists structured_data, drop column if exists transcript, drop column if exists speaker;
    alter table call_sessions drop column if exists metadata;
    alter table search_requirements drop constraint if exists search_requirements_one_typed_value;
    update search_requirements set value = coalesce(value, value_json, to_jsonb(value_text), to_jsonb(value_number), to_jsonb(value_boolean));
    alter table search_requirements alter column value set not null, drop column if exists value_json, drop column if exists value_boolean, drop column if exists value_number, drop column if exists value_text;
    alter table property_searches drop constraint if exists property_searches_bhk_positive, drop constraint if exists property_searches_max_area_positive, drop constraint if exists property_searches_min_area_positive, drop constraint if exists property_searches_max_rent_nonnegative, drop constraint if exists property_searches_min_rent_nonnegative, drop constraint if exists property_searches_area_order, drop constraint if exists property_searches_rent_order, drop column if exists available_from, drop column if exists max_area, drop column if exists min_area, drop column if exists max_rent, drop column if exists min_rent;
    alter table properties drop constraint if exists properties_location_id_fkey, drop constraint if exists properties_amenities_array, drop constraint if exists properties_floor_valid, drop constraint if exists properties_bhk_positive, drop constraint if exists properties_area_positive, drop column if exists area, drop column if exists location_id;
    alter table brokers drop constraint if exists brokers_response_score_range, drop constraint if exists brokers_normalized_phone_sanity, drop constraint if exists brokers_canonical_phone_sanity, drop column if exists response_score, drop column if exists normalized_phone, drop column if exists phone;
    alter table locations drop constraint if exists locations_aliases_array, drop column if exists name;
    alter table users drop constraint if exists users_whatsapp_phone_sanity, drop constraint if exists users_normalized_phone_sanity, drop constraint if exists users_canonical_phone_sanity, drop column if exists normalized_phone, drop column if exists phone;
  `.execute(db);
}
