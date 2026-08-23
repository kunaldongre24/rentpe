import { describe, expect, it, vi } from 'vitest';
import {
  createWhatsAppProvider,
  GupshupWhatsAppProvider,
} from './whatsapp.provider.js';

describe('GupshupWhatsAppProvider', () => {
  it('sends a text message through the Gupshup form API', async () => {
    const fetcher = vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify({ messageId: 'gupshup-1' }), {
          status: 200,
        }),
      ),
    );
    const provider = new GupshupWhatsAppProvider(
      {
        apiKey: 'test-key',
        source: '919900000000',
        apiBaseUrl: 'https://api.gupshup.io',
      },
      fetcher,
    );
    const result = await provider.sendText('919900000001', 'Hello');
    expect(result).toEqual({ providerMessageId: 'gupshup-1' });
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it('uses the local provider unless Gupshup is explicitly selected', () => {
    const previous = process.env.WHATSAPP_PROVIDER;
    delete process.env.WHATSAPP_PROVIDER;
    expect(createWhatsAppProvider().constructor.name).toBe(
      'LocalWhatsAppProvider',
    );
    if (previous === undefined) delete process.env.WHATSAPP_PROVIDER;
    else process.env.WHATSAPP_PROVIDER = previous;
  });
});
