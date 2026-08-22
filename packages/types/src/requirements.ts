import { z } from 'zod';

export const requirementKeySchema = z.enum([
  'city',
  'locality',
  'bhk',
  'min_rent',
  'max_rent',
  'property_type',
  'availability',
  'furnishing',
  'parking',
  'balcony',
  'gym',
  'metro_proximity',
  'pet_friendly',
  'floor_preference',
  'sunlight',
  'amenities',
]);
export const requirementSourceSchema = z.enum([
  'explicit',
  'inferred',
  'system',
  'behavioral',
]);
export const preferenceTypeSchema = z.enum([
  'required',
  'preferred',
  'flexible',
  'excluded',
]);
export const requirementValueSchema = z.union([
  z.string().trim().min(1),
  z.number().finite(),
  z.boolean(),
  z.array(z.string().trim().min(1)).max(100),
  z.record(
    z.string(),
    z.union([z.string(), z.number(), z.boolean(), z.null()]),
  ),
]);
export const requirementUpdateSchema = z.object({
  key: requirementKeySchema,
  value: requirementValueSchema,
  confidence: z.number().min(0).max(1),
  source: requirementSourceSchema.default('explicit'),
  preferenceType: preferenceTypeSchema,
});
export const requirementBatchUpdateSchema = z.object({
  requirements: z.array(requirementUpdateSchema).min(1).max(50),
});
export const searchCreateSchema = z.object({
  userId: z.uuid(),
  expiresAt: z.iso.datetime().nullable().optional(),
});
export const locationResolveSchema = z.object({
  query: z.string().trim().min(1).max(300),
  cityContext: z.string().trim().min(1).max(100).optional(),
});
export const locationResolutionStatusSchema = z.enum([
  'KNOWN',
  'AMBIGUOUS',
  'UNKNOWN',
]);
export type RequirementKey = z.infer<typeof requirementKeySchema>;
export type RequirementUpdate = z.infer<typeof requirementUpdateSchema>;
export type RequirementBatchUpdate = z.infer<
  typeof requirementBatchUpdateSchema
>;
export type SearchCreate = z.infer<typeof searchCreateSchema>;
export type LocationResolve = z.infer<typeof locationResolveSchema>;
export type LocationResolutionStatus = z.infer<
  typeof locationResolutionStatusSchema
>;
