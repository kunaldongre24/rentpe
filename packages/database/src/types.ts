import type { ColumnType, Generated, JSONColumnType } from 'kysely';

type Timestamp = ColumnType<Date, Date | string | undefined, Date | string>;
type Numeric = ColumnType<string, string | number, string | number>;
type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
type JsonObject = { [key: string]: JsonValue };
type Json = JSONColumnType<JsonObject | JsonValue[]>;
type DatabaseExtensionValue = object;

interface Timestamps {
  created_at: Generated<Timestamp>;
  updated_at: Timestamp;
}
export interface UsersTable extends Timestamps {
  id: Generated<string>;
  phone: string;
  normalized_phone: string;
  phone_number: string;
  name: string | null;
  whatsapp_number: string | null;
}
export interface LocationsTable extends Timestamps {
  id: Generated<string>;
  name: string;
  country: string;
  state: string;
  city: string;
  locality: string;
  normalized_name: string;
  aliases: Json;
  latitude: Numeric;
  longitude: Numeric;
  location: Generated<unknown>;
}
export interface BrokersTable extends Timestamps {
  id: Generated<string>;
  name: string;
  phone: string;
  normalized_phone: string;
  phone_number: string;
  company: string | null;
  verification_status: string;
  response_score: Numeric;
  response_rate: Numeric;
  response_time_minutes: number | null;
  quality_score: Numeric;
  active: boolean;
}
export interface PropertySearchesTable extends Timestamps {
  id: Generated<string>;
  user_id: string;
  intent: string;
  status: string;
  city: string | null;
  locality: string | null;
  property_type: string | null;
  bhk: number | null;
  min_budget: Numeric | null;
  max_budget: Numeric | null;
  min_rent: Numeric | null;
  max_rent: Numeric | null;
  min_area: Numeric | null;
  max_area: Numeric | null;
  furnishing: string | null;
  move_in_date: string | null;
  available_from: string | null;
  latitude: Numeric | null;
  longitude: Numeric | null;
  location: Generated<DatabaseExtensionValue> | null;
  search_radius_meters: number | null;
  expires_at: Timestamp | null;
}
export interface SearchRequirementsTable {
  id: Generated<string>;
  search_id: string;
  requirement_key: string;
  value: string | null;
  value_text: string | null;
  value_number: Numeric | null;
  value_boolean: boolean | null;
  value_json: Json | null;
  confidence: Numeric;
  source: string;
  preference_type: string;
  updated_at: Timestamp;
}
export interface PropertiesTable extends Timestamps {
  id: Generated<string>;
  broker_id: string;
  location_id: string;
  title: string;
  description: string;
  property_type: string;
  bhk: number;
  rent: Numeric;
  deposit: Numeric | null;
  area: Numeric;
  area_sqft: Numeric;
  furnishing: string;
  floor: number | null;
  total_floors: number | null;
  parking: boolean;
  balcony: number;
  amenities: Json;
  address: string;
  locality: string;
  city: string;
  latitude: Numeric;
  longitude: Numeric;
  location: Generated<DatabaseExtensionValue>;
  available_from: string;
  status: string;
  quality_score: Numeric;
  freshness_score: Numeric;
  embedding: DatabaseExtensionValue | null;
}
export interface PropertyImagesTable {
  id: Generated<string>;
  property_id: string;
  storage_path: string;
  public_url_or_signed_url: string | null;
  sort_order: number;
  width: number | null;
  height: number | null;
  created_at: Generated<Timestamp>;
}
export interface CallSessionsTable {
  id: Generated<string>;
  user_id: string;
  provider: string;
  provider_call_id: string;
  started_at: Timestamp;
  ended_at: Timestamp | null;
  duration_seconds: number | null;
  status: string;
  transcript_reference: string | null;
  metadata: Json;
  created_at: Generated<Timestamp>;
}
export interface ConversationEventsTable {
  id: Generated<string>;
  call_session_id: string | null;
  user_id: string;
  search_id: string | null;
  event_type: string;
  speaker: string;
  transcript: string;
  structured_data: Json;
  role: string | null;
  content: string | null;
  metadata: Json;
  occurred_at: Generated<Timestamp>;
  created_at: Generated<Timestamp>;
}
export interface PropertyFeedbackTable {
  id: Generated<string>;
  user_id: string;
  search_id: string;
  property_id: string | null;
  feedback_type: string;
  feedback_text: string | null;
  structured_feedback: Json;
  created_at: Generated<Timestamp>;
}
export interface BehavioralPreferencesTable extends Timestamps {
  id: Generated<string>;
  user_id: string;
  search_id: string | null;
  preference_key: string;
  value: Json;
  confidence: Numeric;
  evidence_count: number;
  source: string;
}
export interface PropertyNotificationsTable {
  id: Generated<string>;
  user_id: string;
  search_id: string;
  property_id: string;
  channel: string;
  status: string;
  sent_at: Timestamp | null;
  created_at: Generated<Timestamp>;
}

export interface Database {
  users: UsersTable;
  locations: LocationsTable;
  brokers: BrokersTable;
  property_searches: PropertySearchesTable;
  search_requirements: SearchRequirementsTable;
  properties: PropertiesTable;
  property_images: PropertyImagesTable;
  call_sessions: CallSessionsTable;
  conversation_events: ConversationEventsTable;
  property_feedback: PropertyFeedbackTable;
  behavioral_preferences: BehavioralPreferencesTable;
  property_notifications: PropertyNotificationsTable;
}
