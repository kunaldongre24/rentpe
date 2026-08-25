import { z } from 'zod';

const voiceAgentEnvironmentSchema = z.object({
  INTERNAL_API_URL: z.url().default('http://localhost:3001'),
  INTERNAL_API_TOKEN: z.string().min(16),
});

export function parseVoiceAgentEnvironment(environment: NodeJS.ProcessEnv) {
  return voiceAgentEnvironmentSchema.parse(environment);
}
