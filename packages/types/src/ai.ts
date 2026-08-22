import { z } from 'zod';

export const extractedRequirementSchema = z.object({
  key: z.string().min(1),
  value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]),
  confidence: z.number().min(0).max(1),
  source: z.enum(['explicit', 'inferred', 'system', 'behavioral']),
});
export type ExtractedRequirement = z.infer<typeof extractedRequirementSchema>;

export const structuredRequirementOutputSchema = z.object({
  requirements: z.array(extractedRequirementSchema).max(50),
});
export type StructuredRequirementOutput = z.infer<
  typeof structuredRequirementOutputSchema
>;
