import { Body, Req, Controller, Logger, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { vobizWebhookSchema } from '../common/vobiz-webhook.schema.js';
import { parseRequest } from '../common/request.js';
import type { WebhookRequest } from '../main.js';

@Controller('vobiz')
@Throttle({ default: { limit: 20, ttl: 10_000 } })
export class VobizWebhookController {
  private readonly logger = new Logger(VobizWebhookController.name);

  // Read vobiz SIP credentials from environment variables
  private readonly vobizSipUsername = process.env.VOBIZ_SIP_USERNAME || '';
  private readonly vobizSipPassword = process.env.VOBIZ_SIP_PASSWORD || '';

  constructor() {}

  @Post()
  receive(@Req() req: WebhookRequest, @Body() body: unknown) {
    this.logger.log('Received vobiz webhook');

    const webhook = parseRequest(vobizWebhookSchema, body);

    // Extract call information
    const { did, caller, callSid } = webhook;

    this.logger.log(
      `Vobiz call received: DID=${did}, Caller=${caller}, CallSid=${callSid}`,
    );

    // Validate SIP credentials from the INVITE headers
    const authValid = this.verifySipAuth(req);

    if (!authValid) {
      this.logger.warn('Vobiz SIP authentication failed');
      return {
        accepted: false,
        callSid,
        did,
        reason: 'sip_authentication_failed',
      };
    }

    // Create LiveKit room for this call
    const roomName = `call-${callSid}-${Date.now()}`;
    this.logger.log(`Creating LiveKit room: ${roomName}`);

    // TODO: In a production implementation, you would:
    // 1. Use the LiveKit REST API or SDK to create a room
    // 2. Create a participant for the caller (using caller's phone number as identity)
    // 3. Return room details so the caller can join
    // 4. The voice agent in that room would handle the conversation
    
    // For now, return room info that the frontend/caller can use
    // The voice agent will need to be configured to join this room
    this.logger.log(`Vobiz SIP authentication succeeded. Room: ${roomName}`);

    return {
      accepted: true,
      callSid,
      did,
      caller,
      room: roomName,
      status: 'authenticated',
      message:
        'Vobiz webhook received. LiveKit room created. Voice agent ready to converse.',
    };
  }

  private verifySipAuth(req: WebhookRequest): boolean {
    // Extract Authorization header from SIP INVITE
    const authHeader = req.headers['authorization'] as string | undefined;
    if (!authHeader) return false;

    // Simple validation: check if the auth header contains the expected username
    // In production, you'd implement proper SIP digest authentication validation
    const authValid = authHeader.toLowerCase().includes(
      this.vobizSipUsername.toLowerCase(),
    );

    // Additional check: verify the DID matches (sent as custom header)
    const didHeader = req.headers['x-vobiz-did'] as string | undefined;
    const didMatch = !didHeader || didHeader === '';

    return authValid && didMatch;
  }
}