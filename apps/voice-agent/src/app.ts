import type { HealthResponse } from '@property-assistant/types';

export function getVoiceAgentHealth(): HealthResponse {
  return {
    service: 'voice-agent',
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '0.1.0',
  };
}
