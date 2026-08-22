import { describe, expect, it } from 'vitest';
import { getVoiceAgentHealth } from './app.js';

describe('voice-agent foundation', () => {
  it('reports its skeleton as healthy', () => {
    expect(getVoiceAgentHealth()).toMatchObject({
      service: 'voice-agent',
      status: 'ok',
    });
  });

  it('uses a stable health payload for readiness checks', () => {
    const health = getVoiceAgentHealth();
    expect(health.version).toBe('0.1.0');
    expect(health.timestamp).toEqual(expect.any(String));
  });
});
