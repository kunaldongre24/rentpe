import type {
  VoiceToolRequest,
  VoiceToolResponse,
} from './voice-tool-contracts.js';
import type { BackendToolClient } from './contracts/agent-boundaries.js';

const DEFAULT_TIMEOUT_MS = 4_000;
const INITIALIZATION_TIMEOUT_MS = 15_000;
const DELIVERY_TIMEOUT_MS = 12_000;

export class HttpBackendToolClient implements BackendToolClient {
  constructor(
    public readonly baseUrl: URL,
    private readonly token: string,
    private readonly fetcher: typeof fetch = fetch,
    private readonly timeoutMs = DEFAULT_TIMEOUT_MS,
  ) {}

  async invoke(request: VoiceToolRequest): Promise<VoiceToolResponse> {
    const timeoutMs =
      request.tool === 'initializeCallContext'
        ? INITIALIZATION_TIMEOUT_MS
        : request.tool === 'sendMatchesToWhatsApp'
          ? DELIVERY_TIMEOUT_MS
          : this.timeoutMs;
    const signal = AbortSignal.timeout(timeoutMs);
    const response = await this.fetcher(
      new URL('/api/internal/voice/tools', this.baseUrl),
      {
        method: 'POST',
        headers: {
          authorization: `Bearer ${this.token}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify(request),
        signal,
      },
    );
    const body = (await response.json()) as VoiceToolResponse;
    if (!response.ok)
      throw new Error(`Voice tool request failed with HTTP ${response.status}`);
    return body;
  }
}
