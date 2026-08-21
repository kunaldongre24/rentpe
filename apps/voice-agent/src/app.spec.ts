import { describe, expect, it } from 'vitest';
import { getVoiceAgentHealth } from './app.js';

describe('voice-agent foundation', () => {
  it('reports its skeleton as healthy', () => {
    expect(getVoiceAgentHealth()).toMatchObject({
      service: 'voice-agent',
      status: 'ok',
    });
  });
});
