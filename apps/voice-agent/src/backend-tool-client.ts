import type {
  VoiceToolRequest,
  VoiceToolResponse,
} from '@property-assistant/types';
import type { BackendToolClient } from './contracts/agent-boundaries.js';

export class HttpBackendToolClient implements BackendToolClient {
  constructor(
    public readonly baseUrl: URL,
    private readonly token: string,
    private readonly fetcher: typeof fetch = fetch,
  ) {}

  async invoke(request: VoiceToolRequest): Promise<VoiceToolResponse> {
    const response = await this.fetcher(
      new URL('/api/internal/voice/tools', this.baseUrl),
      {
        method: 'POST',
        headers: {
          authorization: `Bearer ${this.token}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify(request),
      },
    );
    const body = (await response.json()) as VoiceToolResponse;
    if (!response.ok)
      throw new Error(`Voice tool request failed with HTTP ${response.status}`);
    return body;
  }
}
