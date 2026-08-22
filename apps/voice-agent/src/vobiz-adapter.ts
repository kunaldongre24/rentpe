import type {
  TelephonyCallEvent,
  TelephonyProviderAdapter,
} from './contracts/telephony.js';

/**
 * Vobiz payload mapping stays intentionally empty until account-specific
 * webhook fields are confirmed from the official provider documentation.
 */
export class VobizTelephonyAdapter implements TelephonyProviderAdapter {
  readonly providerName = 'vobiz' as const;

  mapCallEvent(payload: unknown): TelephonyCallEvent | null {
    void payload;
    return null;
  }
}
