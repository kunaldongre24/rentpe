import { z } from 'zod';
export * from './ai.js';
export * from './auth.js';
export * from './domain.js';
export * from './feedback.js';
export * from './notifications.js';
export * from './whatsapp.js';
export * from './voice-tools.js';
export * from './requirements.js';
export * from './property-search.js';

export interface HealthResponse {
  service: string;
  status: 'ok';
  timestamp: string;
  version: string;
}

export type RuntimeEnvironment = 'development' | 'test' | 'production';

const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+[1-9]\d{7,14}$/, 'Phone number must be in E.164 format');
const optionalNullableString = z.string().trim().min(1).nullable().optional();
const scoreSchema = z.number().min(0).max(100);
const latitudeSchema = z.number().min(-90).max(90);
const longitudeSchema = z.number().min(-180).max(180);
const dateSchema = z.iso.date();

export const uuidSchema = z.uuid();
export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});
export type Pagination = z.infer<typeof paginationSchema>;

const userShape = {
  phone: phoneSchema,
  name: optionalNullableString,
  whatsappNumber: phoneSchema.nullable().optional(),
};
export const userCreateSchema = z.object(userShape);
export const userUpdateSchema = z
  .object(userShape)
  .partial()
  .refine(
    (value) => Object.keys(value).length > 0,
    'At least one field is required',
  );
export type UserCreate = z.infer<typeof userCreateSchema>;
export type UserUpdate = z.infer<typeof userUpdateSchema>;

const locationShape = {
  name: z.string().trim().min(1).max(200),
  country: z.string().trim().min(1).max(100).default('India'),
  state: z.string().trim().min(1).max(100),
  city: z.string().trim().min(1).max(100),
  aliases: z.array(z.string().trim().min(1).max(200)).max(100).default([]),
  latitude: latitudeSchema,
  longitude: longitudeSchema,
};
export const locationCreateSchema = z.object(locationShape);
export const locationUpdateSchema = z
  .object(locationShape)
  .partial()
  .refine(
    (value) => Object.keys(value).length > 0,
    'At least one field is required',
  );
export type LocationCreate = z.infer<typeof locationCreateSchema>;
export type LocationUpdate = z.infer<typeof locationUpdateSchema>;

export const verificationStatusSchema = z.enum([
  'unverified',
  'pending',
  'verified',
  'rejected',
]);
const brokerShape = {
  name: z.string().trim().min(1).max(200),
  company: optionalNullableString,
  phone: phoneSchema,
  verificationStatus: verificationStatusSchema.default('unverified'),
  active: z.boolean().default(true),
  responseScore: scoreSchema.default(0),
  responseRate: scoreSchema.default(0),
  responseTimeMinutes: z.number().int().min(0).nullable().optional(),
  qualityScore: scoreSchema.default(0),
};
export const brokerCreateSchema = z.object(brokerShape);
export const brokerUpdateSchema = z
  .object(brokerShape)
  .partial()
  .refine(
    (value) => Object.keys(value).length > 0,
    'At least one field is required',
  );
export type BrokerCreate = z.infer<typeof brokerCreateSchema>;
export type BrokerUpdate = z.infer<typeof brokerUpdateSchema>;

export const propertyTypeSchema = z.enum([
  'apartment',
  'independent_house',
  'villa',
  'studio',
]);
export const furnishingSchema = z.enum([
  'unfurnished',
  'semi_furnished',
  'fully_furnished',
]);
export const propertyStatusSchema = z.enum([
  'DRAFT',
  'ACTIVE',
  'PAUSED',
  'RENTED',
  'EXPIRED',
  'DELETED',
]);
const propertyShape = {
  brokerId: uuidSchema,
  locationId: uuidSchema,
  title: z.string().trim().min(1).max(300),
  description: z.string().trim().min(1).max(10_000),
  propertyType: propertyTypeSchema,
  bhk: z.number().int().min(1).max(20),
  rent: z.number().min(0),
  deposit: z.number().min(0).nullable().optional(),
  area: z.number().positive(),
  furnishing: furnishingSchema,
  floor: z.number().int().min(0).nullable().optional(),
  totalFloors: z.number().int().min(0).nullable().optional(),
  parking: z.boolean().default(false),
  balcony: z.number().int().min(0).default(0),
  amenities: z.array(z.string().trim().min(1).max(100)).max(100).default([]),
  address: z.string().trim().min(1).max(1_000),
  locality: z.string().trim().min(1).max(200),
  city: z.string().trim().min(1).max(100),
  latitude: latitudeSchema,
  longitude: longitudeSchema,
  availableFrom: dateSchema,
  status: propertyStatusSchema.default('DRAFT'),
  qualityScore: scoreSchema.default(0),
  freshnessScore: scoreSchema.default(0),
};
const propertyCrossFieldCheck = (value: {
  floor?: number | null;
  totalFloors?: number | null;
}) =>
  value.floor == null ||
  value.totalFloors == null ||
  value.floor <= value.totalFloors;
export const propertyCreateSchema = z
  .object(propertyShape)
  .refine(propertyCrossFieldCheck, {
    message: 'Floor cannot exceed total floors',
    path: ['floor'],
  });
export const propertyUpdateSchema = z
  .object(propertyShape)
  .partial()
  .refine(
    (value) => Object.keys(value).length > 0,
    'At least one field is required',
  )
  .refine(propertyCrossFieldCheck, {
    message: 'Floor cannot exceed total floors',
    path: ['floor'],
  });
export type PropertyCreate = z.infer<typeof propertyCreateSchema>;
export type PropertyUpdate = z.infer<typeof propertyUpdateSchema>;
