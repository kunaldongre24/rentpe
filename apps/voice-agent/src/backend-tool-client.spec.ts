import { describe, expect, it, vi } from 'vitest';
import { HttpBackendToolClient } from './backend-tool-client.js';

describe('HttpBackendToolClient', () => {
  it('sends typed tools to the NestJS internal endpoint', async () => {
    const fetcher = vi.fn().mockResolvedValue(
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
    expect(fetcher).toHaveBeenCalledWith(
      new URL('http://api.test/api/internal/voice/tools'),
      expect.any(Object),
    );
  });
});
