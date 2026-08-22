import { describe, expect, it } from 'vitest';
import { getVobizConfigurationStatus, parseVobizEnvironment } from './vobiz.js';

describe('Vobiz configuration', () => {
  it('allows local development without provider credentials', () => {
    expect(getVobizConfigurationStatus({}).configured).toBe(false);
  });

  it('reports configured status without exposing secrets', () => {
    const status = getVobizConfigurationStatus({
      VOBIZ_ACCOUNT_ID: 'account',
      VOBIZ_DID: '+910000000000',
      VOBIZ_SIP_HOST: 'sip.account.example',
      VOBIZ_SIP_USERNAME: 'user',
      VOBIZ_SIP_PASSWORD: 'secret',
    });
    expect(status).toEqual({
      configured: true,
      provider: 'vobiz',
      didConfigured: true,
      sipConfigured: true,
    });
    expect(JSON.stringify(status)).not.toContain('secret');
  });

  it('validates SIP transport and port', () => {
    expect(() =>
      parseVobizEnvironment({ VOBIZ_SIP_TRANSPORT: 'invalid' }),
    ).toThrow();
    expect(
      parseVobizEnvironment({ VOBIZ_SIP_PORT: '5061' }).VOBIZ_SIP_PORT,
    ).toBe(5061);
  });
});
