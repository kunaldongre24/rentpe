import type { StructuredRequirementOutput } from '@property-assistant/types';

export interface LLMProviderMetadata {
  readonly name: string;
  readonly model: string;
  readonly wireApi: 'responses';
}

export interface LLMProvider {
  readonly metadata: LLMProviderMetadata;
  extractRequirements(input: {
    transcript: string;
  }): Promise<StructuredRequirementOutput>;
}

export interface EmbeddingProvider {
  readonly model: string;
  readonly dimensions: 1536;
  embed(input: string): Promise<readonly number[]>;
}

export class ProviderUnavailableError extends Error {
  constructor(provider: string, operation: string) {
    super(`${provider} is unavailable for ${operation}`);
    this.name = 'ProviderUnavailableError';
  }
}

export class UnconfiguredLLMProvider implements LLMProvider {
  readonly metadata = {
    name: 'unconfigured',
    model: 'none',
    wireApi: 'responses' as const,
  };

  extractRequirements(
    ...args: [{ transcript: string }]
  ): Promise<StructuredRequirementOutput> {
    void args;
    return Promise.reject(new ProviderUnavailableError('LLM', 'extraction'));
  }
}

export class UnconfiguredEmbeddingProvider implements EmbeddingProvider {
  readonly model = 'none';
  readonly dimensions = 1536 as const;

  embed(): Promise<readonly number[]> {
    return Promise.reject(
      new ProviderUnavailableError('embedding', 'generation'),
    );
  }
}
