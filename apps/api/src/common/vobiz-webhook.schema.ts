import { z } from 'zod';

export const vobizWebhookSchema = z
  .object({
    accountId: z.string().trim().optional(),
    AccountSid: z.string().trim().optional(),
    did: z.string().trim().optional(),
    To: z.string().trim().optional(),
    to: z.string().trim().optional(),
    caller: z.string().trim().optional(),
    From: z.string().trim().optional(),
    from: z.string().trim().optional(),
    callSid: z.string().trim().optional(),
    CallSid: z.string().trim().optional(),
    callDirection: z
      .enum(['inbound', 'outbound'])
      .optional()
      .default('inbound'),
    CallStatus: z.string().trim().optional(),
    timestamp: z.string().datetime().optional(),
  })
  .transform((value) => ({
    accountId: value.accountId ?? value.AccountSid,
    did: (value.did ?? value.To ?? value.to ?? '').trim(),
    caller: value.caller ?? value.From ?? value.from,
    callSid: value.callSid ?? value.CallSid,
    callDirection: value.callDirection ?? 'inbound',
    timestamp: value.timestamp,
  }))
  .superRefine((value, ctx) => {
    if (!value.did || value.did.length === 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['did'],
        message: 'did is required',
      });
    }
  });

export type VobizWebhook = z.infer<typeof vobizWebhookSchema>;
