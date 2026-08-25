import { describe, expect, it, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { ConversationService } from './conversation.service.js';

describe('ConversationService', () => {
  it('persists an event through its repository', async () => {
    const event = { id: 'event-1' };
    const repository = { createEvent: vi.fn().mockResolvedValue(event) };
    const service = new ConversationService(repository as never);
    const input = {
      userId: '00000000-0000-4000-8000-000000000001',
      callSessionId: null,
      searchId: null,
      eventType: 'CALL_STARTED',
      speaker: 'system' as const,
      transcript: '',
      structuredData: {},
    };
    await expect(service.createEvent(input)).resolves.toBe(event);
    expect(repository.createEvent).toHaveBeenCalledWith(input);
  });

  it('rejects a missing call session', async () => {
    const repository = { findSession: vi.fn().mockResolvedValue(undefined) };
    await expect(
      new ConversationService(repository as never).getSession('missing'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
