import { z } from 'zod';

const uuidSchema = z.uuid();
const requirementKeySchema = z.enum([
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
const requirementValueSchema = z.union([
  z.string().trim().min(1),
  z.number().finite(),
  z.boolean(),
  z.array(z.string().trim().min(1)).max(100),
]);
const requirementUpdateSchema = z.object({
  key: requirementKeySchema,
  value: requirementValueSchema,
  confidence: z.number().min(0).max(1),
  source: z.enum(['explicit', 'inferred', 'system', 'behavioral']),
  preferenceType: z.enum(['required', 'preferred', 'flexible', 'excluded']),
});

export const locationResolveSchema = z.object({
  query: z.string().trim().min(1).max(300),
  cityContext: z.string().trim().min(1).max(100).nullable(),
});
export const requirementBatchUpdateSchema = z.object({
  requirements: z.array(requirementUpdateSchema).min(1).max(50),
});
export const propertySearchQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100),
  offset: z.coerce.number().int().min(0),
  latitude: z.coerce.number().min(-90).max(90).nullable(),
  longitude: z.coerce.number().min(-180).max(180).nullable(),
  radiusMeters: z.coerce.number().positive().max(100_000),
});

export const voiceToolNameSchema = z.enum([
  'initializeCallContext',
  'getUser',
  'updateRequirement',
  'resolveLocation',
  'getRequirementState',
  'searchCandidates',
  'getMatchCount',
  'sendMatchesToWhatsApp',
  'finishRequirementCollection',
]);

export const voiceToolResponseSchema = z.object({
  ok: z.boolean(),
  tool: voiceToolNameSchema,
  data: z.unknown().optional(),
  error: z.string().optional(),
});

export const voiceToolRequestSchema = z.discriminatedUnion('tool', [
  z.object({
    tool: z.literal('initializeCallContext'),
    callerPhone: z.string().regex(/^\+[1-9]\d{7,14}$/),
  }),
  z.object({ tool: z.literal('getUser'), userId: uuidSchema }),
  z.object({
    tool: z.literal('updateRequirement'),
    searchId: uuidSchema,
    requirements: requirementBatchUpdateSchema.shape.requirements,
  }),
  z.object({
    tool: z.literal('resolveLocation'),
    query: locationResolveSchema.shape.query,
    cityContext: z.string().trim().min(1).max(100).optional(),
  }),
  z.object({ tool: z.literal('getRequirementState'), searchId: uuidSchema }),
  z.object({
    tool: z.literal('searchCandidates'),
    searchId: uuidSchema,
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).default(0),
    latitude: z.coerce.number().min(-90).max(90).optional(),
    longitude: z.coerce.number().min(-180).max(180).optional(),
    radiusMeters: z.coerce.number().positive().max(100_000).default(10_000),
  }),
  z.object({ tool: z.literal('getMatchCount'), searchId: uuidSchema }),
  z.object({
    tool: z.literal('sendMatchesToWhatsApp'),
    userId: uuidSchema,
    searchId: uuidSchema,
    limit: z.coerce.number().int().min(1).max(5),
  }),
  z.object({
    tool: z.literal('finishRequirementCollection'),
    searchId: uuidSchema,
  }),
]);

export type VoiceToolRequest = z.infer<typeof voiceToolRequestSchema>;
export type VoiceToolResponse = z.infer<typeof voiceToolResponseSchema>;
