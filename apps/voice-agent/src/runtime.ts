import type {
  BackendToolClient,
  RealtimeMediaProvider,
  VoiceConversationRuntime,
} from './contracts/agent-boundaries.js';
import type {
  VoiceToolRequest,
  VoiceToolResponse,
} from './voice-tool-contracts.js';

export class VoiceAgentRuntime implements VoiceConversationRuntime {
  constructor(
    public readonly backend: BackendToolClient,
    public readonly media: RealtimeMediaProvider,
  ) {}

  async handleTool(request: VoiceToolRequest): Promise<VoiceToolResponse> {
    return this.backend.invoke(request);
  }
}
