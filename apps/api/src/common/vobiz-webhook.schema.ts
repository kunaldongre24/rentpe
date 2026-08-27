import { z } from 'zod';

export const vobizWebhookSchema = z.object({
  accountId: z.string().trim().optional(),
  did: z.string().trim().min(1),
  caller: z.string().trim().min(1).optional(),
  callSid: z.string().trim().uuid().optional(),
  callDirection: z.enum(['inbound', 'outbound']).default('inbound'),
  timestamp: z.string().datetime().optional(),
});

export type VobizWebhook = z.infer<typeof vobizWebhookSchema>;
