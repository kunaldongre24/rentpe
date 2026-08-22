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
