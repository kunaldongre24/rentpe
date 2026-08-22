import type {
  VoiceToolRequest,
  VoiceToolResponse,
} from '@property-assistant/types';

export interface VoiceAgentLifecycle {
  start(): Promise<void>;
  stop(): Promise<void>;
}

export interface BackendToolClient {
  readonly baseUrl: URL;
  invoke(request: VoiceToolRequest): Promise<VoiceToolResponse>;
}

export interface RealtimeMediaProvider {
  readonly providerName: 'livekit';
}

export interface VoiceConversationRuntime {
  readonly backend: BackendToolClient;
  readonly media: RealtimeMediaProvider;
  handleTool(request: VoiceToolRequest): Promise<VoiceToolResponse>;
}
