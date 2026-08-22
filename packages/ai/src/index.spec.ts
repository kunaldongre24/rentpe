import { describe, expect, it } from 'vitest';
import { ProviderUnavailableError, UnconfiguredLLMProvider } from './index.js';
import { structuredRequirementOutputSchema } from '@property-assistant/types';

describe('AI provider boundaries', () => {
  it('rejects use of an unconfigured LLM provider safely', async () => {
    await expect(
      new UnconfiguredLLMProvider().extractRequirements({
        transcript: '2 BHK in HSR',
      }),
    ).rejects.toBeInstanceOf(ProviderUnavailableError);
  });

  it('validates structured model output', () => {
    expect(
      structuredRequirementOutputSchema.parse({
        requirements: [
          { key: 'bhk', value: 2, confidence: 0.99, source: 'explicit' },
        ],
      }).requirements,
    ).toHaveLength(1);
  });
});
