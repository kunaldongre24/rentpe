export interface VoiceAgentLifecycle {
  start(): Promise<void>;
  stop(): Promise<void>;
}

export interface BackendToolClient {
  readonly baseUrl: URL;
}

export interface RealtimeMediaProvider {
  readonly providerName: 'livekit';
}
