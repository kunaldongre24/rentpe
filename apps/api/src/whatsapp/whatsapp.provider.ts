import type { WhatsAppPropertyMessage } from '@property-assistant/types';

export interface WhatsAppProvider {
  sendText(to: string, text: string): Promise<{ providerMessageId: string }>;
  sendImage(
    to: string,
    imagePath: string,
    caption: string,
  ): Promise<{ providerMessageId: string }>;
  sendProperty(message: WhatsAppPropertyMessage): Promise<{
    providerMessageId: string;
  }>;
}

export class LocalWhatsAppProvider implements WhatsAppProvider {
  sendText(to: string, text: string): Promise<{ providerMessageId: string }> {
    return Promise.resolve({
      providerMessageId: `local-text-${to}-${text.length}`,
    });
  }

  sendImage(
    to: string,
    imagePath: string,
    caption: string,
  ): Promise<{ providerMessageId: string }> {
    return Promise.resolve({
      providerMessageId: `local-image-${to}-${imagePath}-${caption.length}`,
    });
  }

  async sendProperty(message: WhatsAppPropertyMessage) {
    if (message.imagePath)
      return this.sendImage(message.to, message.imagePath, message.text);
    return this.sendText(message.to, message.text);
  }
}

interface GupshupResponse {
  messageId?: unknown;
  message_id?: unknown;
  status?: unknown;
  message?: unknown;
}

export interface GupshupConfig {
  apiKey: string;
  source: string;
  apiBaseUrl: string;
}

export class GupshupWhatsAppProvider implements WhatsAppProvider {
  constructor(
    private readonly config: GupshupConfig,
    private readonly fetcher: typeof fetch = fetch,
  ) {}

  sendText(to: string, text: string) {
    return this.send(to, { type: 'text', text });
  }

  sendImage(to: string, imagePath: string, caption: string) {
    return this.send(to, {
      type: 'image',
      image: { link: imagePath },
      caption,
    });
  }

  sendProperty(message: WhatsAppPropertyMessage) {
    // Gupshup requires a publicly reachable image URL. Placeholder storage
    // paths are sent as text until property media storage is configured.
    if (message.imagePath && /^https?:\/\//i.test(message.imagePath))
      return this.sendImage(message.to, message.imagePath, message.text);
    return this.sendText(message.to, message.text);
  }

  private async send(to: string, message: Record<string, unknown>) {
    const body = new URLSearchParams({
      channel: 'whatsapp',
      source: this.config.source,
      destination: to,
      message: JSON.stringify(message),
    });
    const response = await this.fetcher(
      new URL('/wa/api/v1/msg', this.config.apiBaseUrl),
      {
        method: 'POST',
        headers: {
          apikey: this.config.apiKey,
          'content-type': 'application/x-www-form-urlencoded',
        },
        body,
      },
    );
    const payload = (await response.json()) as GupshupResponse;
    if (!response.ok)
      throw new Error(`Gupshup request failed with HTTP ${response.status}`);
    const providerMessageId =
      typeof payload.messageId === 'string'
        ? payload.messageId
        : typeof payload.message_id === 'string'
          ? payload.message_id
          : undefined;
    if (!providerMessageId)
      throw new Error('Gupshup response did not include a message ID');
    return { providerMessageId };
  }
}

export function createWhatsAppProvider(): WhatsAppProvider {
  if (process.env.WHATSAPP_PROVIDER !== 'gupshup')
    throw new Error('RentPe requires WHATSAPP_PROVIDER=gupshup');
  const apiKey = process.env.GUPSHUP_API_KEY;
  const source = process.env.GUPSHUP_SOURCE;
  if (!apiKey || !source)
    throw new Error(
      'Gupshup requires GUPSHUP_API_KEY and GUPSHUP_SOURCE when WHATSAPP_PROVIDER=gupshup',
    );
  return new GupshupWhatsAppProvider({
    apiKey,
    source,
    apiBaseUrl: process.env.GUPSHUP_API_BASE_URL ?? 'https://api.gupshup.io',
  });
}
