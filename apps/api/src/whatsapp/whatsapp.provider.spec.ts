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

  it('uses the local adapter outside production when no provider is configured', () => {
    const previousProvider = process.env.WHATSAPP_PROVIDER;
    const previousNodeEnvironment = process.env.NODE_ENV;
    delete process.env.WHATSAPP_PROVIDER;
    process.env.NODE_ENV = 'test';
    expect(createWhatsAppProvider().constructor.name).toBe(
      'LocalWhatsAppProvider',
    );
    restoreEnvironment('WHATSAPP_PROVIDER', previousProvider);
    restoreEnvironment('NODE_ENV', previousNodeEnvironment);
  });

  it('requires Gupshup in production', () => {
    const previousProvider = process.env.WHATSAPP_PROVIDER;
    const previousNodeEnvironment = process.env.NODE_ENV;
    delete process.env.WHATSAPP_PROVIDER;
    process.env.NODE_ENV = 'production';
    expect(() => createWhatsAppProvider()).toThrow(
      'Production requires WHATSAPP_PROVIDER=gupshup',
    );
    restoreEnvironment('WHATSAPP_PROVIDER', previousProvider);
    restoreEnvironment('NODE_ENV', previousNodeEnvironment);
  });
});

function restoreEnvironment(key: string, value: string | undefined): void {
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
}
