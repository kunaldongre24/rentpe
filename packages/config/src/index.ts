import { z } from 'zod';

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

export const voiceAgentEnvironmentSchema = baseEnvironmentSchema.extend({
  VOICE_AGENT_PORT: z.coerce.number().int().positive().default(3002),
  INTERNAL_API_URL: z.url().default('http://localhost:3001'),
  INTERNAL_API_TOKEN: z.string().min(16),
});

export function parseApiEnvironment(environment: NodeJS.ProcessEnv) {
  return apiEnvironmentSchema.parse(environment);
}

export function parseVoiceAgentEnvironment(environment: NodeJS.ProcessEnv) {
  return voiceAgentEnvironmentSchema.parse(environment);
}
