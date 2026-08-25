import { z } from 'zod';

const uuidSchema = z.uuid();
const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const searchStatusSchema = z.enum([
  'ACTIVE',
  'PAUSED',
  'COMPLETED',
  'EXPIRED',
  'CANCELLED',
]);
export const searchUpdateSchema = z
  .object({
    status: searchStatusSchema.optional(),
    expiresAt: z.iso.datetime().nullable().optional(),
  })
  .refine(
    (value) => Object.keys(value).length > 0,
    'At least one field is required',
  );
export const searchListQuerySchema = paginationSchema.extend({
  userId: uuidSchema.optional(),
  status: searchStatusSchema.optional(),
});

export const callStatusSchema = z.enum([
  'started',
  'in_progress',
  'completed',
  'failed',
]);
export const callSessionCreateSchema = z.object({
  userId: uuidSchema,
  provider: z.string().trim().min(1).max(100),
  providerCallId: z.string().trim().min(1).max(300),
  startedAt: z.iso.datetime(),
  status: callStatusSchema,
  metadata: z.record(z.string(), z.unknown()).default({}),
});
export const callSessionUpdateSchema = z
  .object({
    endedAt: z.iso.datetime().nullable().optional(),
    durationSeconds: z.number().int().min(0).nullable().optional(),
    status: callStatusSchema.optional(),
    transcriptReference: z
      .string()
      .trim()
      .min(1)
      .max(2_000)
      .nullable()
      .optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .refine(
    (value) => Object.keys(value).length > 0,
    'At least one field is required',
  );
export const conversationSpeakerSchema = z.enum([
  'user',
  'assistant',
  'system',
  'tool',
]);
export const conversationEventCreateSchema = z.object({
  callSessionId: uuidSchema.nullable().optional(),
  userId: uuidSchema,
  searchId: uuidSchema.nullable().optional(),
  eventType: z.string().trim().min(1).max(100),
  speaker: conversationSpeakerSchema,
  transcript: z.string().max(20_000).default(''),
  structuredData: z.record(z.string(), z.unknown()).default({}),
  occurredAt: z.iso.datetime().optional(),
});
export const conversationListQuerySchema = paginationSchema.extend({
  userId: uuidSchema.optional(),
  callSessionId: uuidSchema.optional(),
  searchId: uuidSchema.optional(),
});

export const preferenceCreateSchema = z.object({
  userId: uuidSchema,
  searchId: uuidSchema.nullable().optional(),
  key: z.string().trim().min(1).max(100),
  value: z.unknown(),
  confidence: z.number().min(0).max(1),
  evidenceCount: z.number().int().positive().default(1),
  source: z.enum(['explicit', 'inferred', 'system', 'behavioral']),
});
export const preferenceUpdateSchema = z
  .object({
    value: z.unknown().optional(),
    confidence: z.number().min(0).max(1).optional(),
    evidenceCount: z.number().int().positive().optional(),
    source: z.enum(['explicit', 'inferred', 'system', 'behavioral']).optional(),
  })
  .refine(
    (value) => Object.keys(value).length > 0,
    'At least one field is required',
  );
export const preferenceListQuerySchema = paginationSchema.extend({
  userId: uuidSchema.optional(),
  searchId: uuidSchema.optional(),
});

export type SearchUpdate = z.infer<typeof searchUpdateSchema>;
export type SearchListQuery = z.infer<typeof searchListQuerySchema>;
export type CallSessionCreate = z.infer<typeof callSessionCreateSchema>;
export type CallSessionUpdate = z.infer<typeof callSessionUpdateSchema>;
export type ConversationEventCreate = z.infer<
  typeof conversationEventCreateSchema
>;
export type ConversationListQuery = z.infer<typeof conversationListQuerySchema>;
export type PreferenceCreate = z.infer<typeof preferenceCreateSchema>;
export type PreferenceUpdate = z.infer<typeof preferenceUpdateSchema>;
export type PreferenceListQuery = z.infer<typeof preferenceListQuerySchema>;
