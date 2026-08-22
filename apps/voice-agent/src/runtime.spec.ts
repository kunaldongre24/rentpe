import { describe, expect, it, vi } from 'vitest';
import { VoiceAgentRuntime } from './runtime.js';

describe('VoiceAgentRuntime', () => {
  it('delegates tool calls to the authenticated backend client', async () => {
    const invoke = vi.fn().mockResolvedValue({
      ok: true,
      tool: 'getRequirementState',
      data: { ready: false },
    });
    const runtime = new VoiceAgentRuntime(
      { baseUrl: new URL('http://api.test'), invoke },
      { providerName: 'livekit' },
    );
    const result = await runtime.handleTool({
      tool: 'getRequirementState',
      searchId: '00000000-0000-4000-8000-000000000001',
    });
    expect(invoke).toHaveBeenCalledOnce();
    expect(result).toMatchObject({ ok: true, tool: 'getRequirementState' });
  });
});
