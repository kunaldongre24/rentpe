import { describe, expect, it, vi } from 'vitest';
import { HttpBackendToolClient } from './backend-tool-client.js';

describe('HttpBackendToolClient', () => {
  it('sends typed tools to the NestJS internal endpoint', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ ok: true, tool: 'getUser', data: {} }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    const client = new HttpBackendToolClient(
      new URL('http://api.test'),
      'internal-token',
      fetcher,
    );
    await client.invoke({
      tool: 'getUser',
      userId: '00000000-0000-4000-8000-000000000001',
    });
    const call = fetcher.mock.calls[0];
    expect(call?.[0]).toEqual(
      new URL('http://api.test/api/internal/voice/tools'),
    );
    expect(call?.[1]?.signal).toBeInstanceOf(AbortSignal);
  });

  it('aborts backend calls at the configured timeout', async () => {
    const fetcher = vi.fn(
      (_url: string | URL | Request, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () =>
            reject(new Error('request aborted')),
          );
        }),
    );
    const client = new HttpBackendToolClient(
      new URL('http://api.test'),
      'internal-token',
      fetcher,
      5,
    );

    await expect(
      client.invoke({
        tool: 'getUser',
        userId: '00000000-0000-4000-8000-000000000001',
      }),
    ).rejects.toThrow('request aborted');
  });
});
