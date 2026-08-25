import { describe, expect, it, vi } from 'vitest';
import type { BackendToolClient } from './contracts/agent-boundaries.js';
import {
  createVoiceTools,
  getCallerPhone,
  initializeCallContext,
  type CallContext,
} from './livekit-tools.js';

const firstContext: CallContext = {
  userId: '00000000-0000-4000-8000-000000000001',
  searchId: '00000000-0000-4000-8000-000000000002',
  callerPhone: '+919876543210',
};
const secondContext: CallContext = {
  userId: '00000000-0000-4000-8000-000000000003',
  searchId: '00000000-0000-4000-8000-000000000004',
  callerPhone: '+919876543211',
};

type ToolRequest = Parameters<BackendToolClient['invoke']>[0];
type ExecutableTool = {
  name: string;
  execute: (input: Record<string, unknown>, options: never) => Promise<unknown>;
};

function findTool(tools: ReturnType<typeof createVoiceTools>, name: string) {
  return tools.find((tool) => tool.name === name) as unknown as ExecutableTool;
}

describe('LiveKit voice tools', () => {
  it('reads and normalizes the inbound SIP caller number', () => {
    expect(
      getCallerPhone({
        identity: 'sip_random-id',
        attributes: { 'sip.phoneNumber': '98765 43210' },
      }),
    ).toBe('+919876543210');
    expect(
      getCallerPhone({ identity: 'sip_+919876543211', attributes: {} }),
    ).toBe('+919876543211');
  });

  it('initializes typed call context through NestJS', async () => {
    const invoke = vi.fn().mockResolvedValue({
      ok: true,
      tool: 'initializeCallContext',
      data: firstContext,
    });
    const backend: BackendToolClient = {
      baseUrl: new URL('http://api.test'),
      invoke,
    };

    await expect(
      initializeCallContext(backend, firstContext.callerPhone),
    ).resolves.toEqual(firstContext);
    expect(invoke).toHaveBeenCalledWith({
      tool: 'initializeCallContext',
      callerPhone: firstContext.callerPhone,
    });
  });

  it('keeps search IDs isolated in each call tool closure', async () => {
    const invoke = vi.fn((request: ToolRequest) =>
      Promise.resolve({
        ok: true,
        tool: request.tool,
        data: {},
      }),
    );
    const backend: BackendToolClient = {
      baseUrl: new URL('http://api.test'),
      invoke,
    };
    const firstTool = findTool(
      createVoiceTools(backend, firstContext),
      'getRequirementState',
    );
    const secondTool = findTool(
      createVoiceTools(backend, secondContext),
      'getRequirementState',
    );

    await firstTool.execute({}, undefined as never);
    await secondTool.execute({}, undefined as never);

    expect(invoke).toHaveBeenNthCalledWith(1, {
      tool: 'getRequirementState',
      searchId: firstContext.searchId,
    });
    expect(invoke).toHaveBeenNthCalledWith(2, {
      tool: 'getRequirementState',
      searchId: secondContext.searchId,
    });
  });

  it('returns a safe conversational result when NestJS is unavailable', async () => {
    const backend: BackendToolClient = {
      baseUrl: new URL('http://api.test'),
      invoke: vi.fn().mockRejectedValue(new Error('private network detail')),
    };
    const tool = findTool(createVoiceTools(backend, firstContext), 'getUser');

    await expect(tool.execute({}, undefined as never)).resolves.toEqual({
      success: false,
      message:
        'माफ़ कीजिए, यह जानकारी अभी उपलब्ध नहीं है। कृपया थोड़ी देर बाद फिर कोशिश करें।',
    });
  });
});
