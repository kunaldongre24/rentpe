export type TelephonyCallStatus =
  | 'ringing'
  | 'answered'
  | 'connected'
  | 'disconnected'
  | 'failed'
  | 'busy'
  | 'timeout';

export interface TelephonyCallIdentity {
  providerCallId?: string;
  sipCallId?: string;
  livekitRoomId?: string;
  livekitParticipantId?: string;
  projectCallSessionId: string;
}

export interface TelephonyCallEvent {
  status: TelephonyCallStatus;
  identity: TelephonyCallIdentity;
  occurredAt: string;
  metadata?: Record<string, string>;
}

export interface TelephonyProviderAdapter {
  readonly providerName: 'vobiz';
  mapCallEvent(payload: unknown): TelephonyCallEvent | null;
}

export interface SipConfiguration {
  host?: string;
  port: number;
  transport: 'udp' | 'tcp' | 'tls';
  did?: string;
  username?: string;
}

export function createProjectCallSessionId(seed: string): string {
  const normalized = seed.trim();
  if (!normalized) throw new Error('A call session seed is required');
  return `call-${normalized}`;
}
