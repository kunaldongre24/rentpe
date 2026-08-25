import { z } from 'zod';
import {
  locationResolveSchema,
  requirementBatchUpdateSchema,
} from './requirements.js';
import { propertySearchQuerySchema } from './property-search.js';

const uuidSchema = z.uuid();

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
    cityContext: locationResolveSchema.shape.cityContext,
  }),
  z.object({ tool: z.literal('getRequirementState'), searchId: uuidSchema }),
  z.object({
    tool: z.literal('searchCandidates'),
    searchId: uuidSchema,
    limit: propertySearchQuerySchema.shape.limit,
    offset: propertySearchQuerySchema.shape.offset,
    latitude: propertySearchQuerySchema.shape.latitude,
    longitude: propertySearchQuerySchema.shape.longitude,
    radiusMeters: propertySearchQuerySchema.shape.radiusMeters,
  }),
  z.object({ tool: z.literal('getMatchCount'), searchId: uuidSchema }),
  z.object({
    tool: z.literal('sendMatchesToWhatsApp'),
    userId: uuidSchema,
    searchId: uuidSchema,
    limit: z.coerce.number().int().min(1).max(5).default(3),
  }),
  z.object({
    tool: z.literal('finishRequirementCollection'),
    searchId: uuidSchema,
  }),
]);

export type VoiceToolName = z.infer<typeof voiceToolNameSchema>;
export type VoiceToolRequest = z.infer<typeof voiceToolRequestSchema>;

export const voiceToolResponseSchema = z.object({
  ok: z.boolean(),
  tool: voiceToolNameSchema,
  data: z.unknown().optional(),
  error: z.string().optional(),
});
export type VoiceToolResponse = z.infer<typeof voiceToolResponseSchema>;
