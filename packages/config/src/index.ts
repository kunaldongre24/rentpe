import { z } from 'zod';
export * from './vobiz.js';

export const whatsappEnvironmentSchema = z
  .object({
    WHATSAPP_PROVIDER: z.literal('gupshup').default('gupshup'),
    GUPSHUP_API_KEY: z.string().min(1).optional(),
    GUPSHUP_SOURCE: z.string().min(1).optional(),
    GUPSHUP_API_BASE_URL: z.url().default('https://api.gupshup.io'),
  })
  .superRefine((value, context) => {
    if (value.WHATSAPP_PROVIDER === 'gupshup') {
      if (!value.GUPSHUP_API_KEY)
        context.addIssue({
          code: 'custom',
          path: ['GUPSHUP_API_KEY'],
          message: 'Gupshup API key is required',
        });
      if (!value.GUPSHUP_SOURCE)
        context.addIssue({
          code: 'custom',
          path: ['GUPSHUP_SOURCE'],
          message: 'Gupshup source is required',
        });
    }
  });

export interface PropertySearchWeights {
  location: number;
  rent: number;
  bhk: number;
  availability: number;
  furnishing: number;
  amenities: number;
  quality: number;
}

export const propertySearchWeights: PropertySearchWeights = Object.freeze({
  location: 30,
  rent: 25,
  bhk: 15,
  availability: 10,
  furnishing: 10,
  amenities: 5,
  quality: 5,
});

export const baseEnvironmentSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
});

export const apiEnvironmentSchema = baseEnvironmentSchema.extend({
  API_HOST: z.string().default('0.0.0.0'),
  API_PORT: z.coerce.number().int().positive().default(3001),
  DATABASE_URL: z.string().min(1),
  DATABASE_POOL_MAX: z.coerce.number().int().positive().default(10),
  DATABASE_IDLE_TIMEOUT_MS: z.coerce.number().int().positive().default(30_000),
  DATABASE_CONNECT_TIMEOUT_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(5_000),
});

export const voiceAgentEnvironmentSchema = baseEnvironmentSchema
  .extend({
    VOICE_AGENT_PORT: z.coerce.number().int().positive().default(3002),
    INTERNAL_API_URL: z.url().default('http://localhost:3001'),
    INTERNAL_API_TOKEN: z.string().min(16),
  })
  .superRefine((value, context) => {
    if (
      value.NODE_ENV === 'production' &&
      (value.INTERNAL_API_TOKEN ===
        'replace-with-a-long-random-development-token' ||
        value.INTERNAL_API_TOKEN.length < 32)
    )
      context.addIssue({
        code: 'custom',
        path: ['INTERNAL_API_TOKEN'],
        message:
          'A random production internal token of at least 32 characters is required',
      });
  });

export function parseApiEnvironment(environment: NodeJS.ProcessEnv) {
  return apiEnvironmentSchema.parse(environment);
}

export function parseVoiceAgentEnvironment(environment: NodeJS.ProcessEnv) {
  return voiceAgentEnvironmentSchema.parse(environment);
}
