import { z } from 'zod';

export const dashboardRoleSchema = z.enum(['ADMIN', 'BROKER', 'OWNER']);
export const dashboardAccountStatusSchema = z.enum([
  'INVITED',
  'ACTIVE',
  'SUSPENDED',
]);
export const dashboardAccountCreateSchema = z
  .object({
    authUserId: z.uuid(),
    email: z.email(),
    displayName: z.string().trim().min(1).max(200).nullable().optional(),
    phone: z
      .string()
      .trim()
      .regex(/^\+[1-9]\d{7,14}$/)
      .nullable()
      .optional(),
    role: dashboardRoleSchema,
    brokerId: z.uuid().nullable().optional(),
  })
  .refine((value) => value.role === 'ADMIN' || value.brokerId != null, {
    message: 'Broker and owner accounts require a broker profile',
    path: ['brokerId'],
  });
export const dashboardAccountStatusUpdateSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED']),
});
export const listingStatusUpdateSchema = z.object({
  status: z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'RENTED', 'EXPIRED']),
});

export type DashboardRole = z.infer<typeof dashboardRoleSchema>;
export type DashboardAccountCreate = z.infer<
  typeof dashboardAccountCreateSchema
>;
export type ListingStatusUpdate = z.infer<typeof listingStatusUpdateSchema>;
