import { z } from 'zod';

export const whatsappPropertyMessageSchema = z.object({
  to: z.string().min(1),
  propertyId: z.uuid(),
  imagePath: z.string().min(1).optional(),
  text: z.string().min(1),
});
export type WhatsAppPropertyMessage = z.infer<
  typeof whatsappPropertyMessageSchema
>;

export const whatsappWebhookSchema = z.object({
  from: z.string().min(1),
  text: z.string().trim().min(1),
});
export type WhatsAppWebhook = z.infer<typeof whatsappWebhookSchema>;

export function isShowMoreCommand(text: string): boolean {
  return /^(show\s+more|more(?:\s+properties)?|next)$/i.test(text.trim());
}
