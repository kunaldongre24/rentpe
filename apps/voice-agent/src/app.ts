import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { HealthResponse } from '@property-assistant/types';

const pkg = JSON.parse(
  readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), '../package.json'),
    'utf-8',
  ),
) as { version: string };

export function getVoiceAgentHealth(): HealthResponse {
  return {
    service: 'voice-agent',
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: pkg.version,
  };
}
