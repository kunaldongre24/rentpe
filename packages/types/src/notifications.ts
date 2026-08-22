import { z } from 'zod';

export const propertyNotificationTriggerSchema = z.object({
  propertyId: z.uuid(),
});
export type PropertyNotificationTrigger = z.infer<
  typeof propertyNotificationTriggerSchema
>;
