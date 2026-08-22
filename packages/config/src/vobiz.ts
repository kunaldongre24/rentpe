import { z } from 'zod';

export const vobizEnvironmentSchema = z.object({
  VOBIZ_ACCOUNT_ID: z.string().trim().min(1).optional(),
  VOBIZ_DID: z.string().trim().min(1).optional(),
  VOBIZ_SIP_HOST: z.string().trim().min(1).optional(),
  VOBIZ_SIP_PORT: z.coerce.number().int().positive().default(5060),
  VOBIZ_SIP_TRANSPORT: z.enum(['udp', 'tcp', 'tls']).default('tls'),
  VOBIZ_SIP_USERNAME: z.string().trim().min(1).optional(),
  VOBIZ_SIP_PASSWORD: z.string().min(1).optional(),
});

export type VobizEnvironment = z.infer<typeof vobizEnvironmentSchema>;

export function parseVobizEnvironment(environment: NodeJS.ProcessEnv) {
  return vobizEnvironmentSchema.parse(environment);
}

export function getVobizConfigurationStatus(environment: NodeJS.ProcessEnv) {
  const parsed = parseVobizEnvironment(environment);
  const fields = [
    parsed.VOBIZ_ACCOUNT_ID,
    parsed.VOBIZ_DID,
    parsed.VOBIZ_SIP_HOST,
    parsed.VOBIZ_SIP_USERNAME,
    parsed.VOBIZ_SIP_PASSWORD,
  ];
  return {
    configured: fields.every(Boolean),
    provider: 'vobiz' as const,
    didConfigured: Boolean(parsed.VOBIZ_DID),
    sipConfigured: Boolean(
      parsed.VOBIZ_SIP_HOST &&
      parsed.VOBIZ_SIP_USERNAME &&
      parsed.VOBIZ_SIP_PASSWORD,
    ),
  };
}
