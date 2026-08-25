import { describe, expect, it, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { PreferenceService } from './preference.service.js';

describe('PreferenceService', () => {
  it('returns preferences from the repository', async () => {
    const repository = {
      list: vi.fn().mockResolvedValue([{ id: 'preference-1' }]),
    };
    await expect(
      new PreferenceService(repository as never).list({ limit: 10, offset: 0 }),
    ).resolves.toEqual([{ id: 'preference-1' }]);
  });

  it('maps missing preferences to NotFoundException', async () => {
    const repository = { findById: vi.fn().mockResolvedValue(undefined) };
    await expect(
      new PreferenceService(repository as never).get('missing'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
