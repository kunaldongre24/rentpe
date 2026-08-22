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
});
export type PropertyFeedbackInput = z.infer<typeof propertyFeedbackSchema>;
