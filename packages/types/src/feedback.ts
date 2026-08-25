import { z } from 'zod';

export const feedbackTypeSchema = z.enum([
  'liked',
  'disliked',
  'shortlisted',
  'contacted',
  'rejected',
  'ignored',
  'opened',
]);
export const propertyFeedbackSchema = z.object({
  userId: z.uuid(),
  searchId: z.uuid(),
  propertyId: z.uuid().nullable().optional(),
  feedbackType: feedbackTypeSchema,
  feedbackText: z.string().trim().max(2_000).nullable().optional(),
  structuredFeedback: z.record(z.string(), z.unknown()).optional(),
});
export type PropertyFeedbackInput = z.infer<typeof propertyFeedbackSchema>;
