import { Body, Controller, Headers, Post } from '@nestjs/common';
import { voiceToolRequestSchema } from '@property-assistant/types';
import { parseRequest } from '../common/request.js';
import { VoiceToolsService } from './voice-tools.service.js';

@Controller('internal/voice/tools')
export class VoiceToolsController {
  constructor(private readonly tools: VoiceToolsService) {}

  @Post()
  invoke(
    @Body() body: unknown,
    @Headers('authorization') authorization?: string,
  ) {
    const token = authorization?.startsWith('Bearer ')
      ? authorization.slice('Bearer '.length)
      : undefined;
    return this.tools.invoke(parseRequest(voiceToolRequestSchema, body), token);
  }
}
