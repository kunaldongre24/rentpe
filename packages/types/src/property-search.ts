import { z } from 'zod';

export const propertySearchQuerySchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).default(0),
    latitude: z.coerce.number().min(-90).max(90).optional(),
    longitude: z.coerce.number().min(-180).max(180).optional(),
    radiusMeters: z.coerce.number().positive().max(100_000).default(10_000),
  })
  .refine(
    (value) =>
      (value.latitude == null && value.longitude == null) ||
      (value.latitude != null && value.longitude != null),
    { message: 'latitude and longitude must be provided together' },
  );
export type PropertySearchQuery = z.infer<typeof propertySearchQuerySchema>;
