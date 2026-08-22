import { describe, expect, it } from 'vitest';
import { createProjectCallSessionId } from './contracts/telephony.js';
import { VobizTelephonyAdapter } from './vobiz-adapter.js';

describe('Vobiz telephony boundary', () => {
  it('isolates call session identifiers', () => {
    expect(createProjectCallSessionId('vobiz-call-a')).toBe(
      'call-vobiz-call-a',
    );
    expect(createProjectCallSessionId('vobiz-call-b')).not.toBe(
      createProjectCallSessionId('vobiz-call-a'),
    );
  });

  it('does not invent undocumented webhook mappings', () => {
    expect(
      new VobizTelephonyAdapter().mapCallEvent({ unknown: true }),
    ).toBeNull();
  });
});
