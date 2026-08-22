import type { EmbeddingProvider } from '@property-assistant/ai';
import type { BehavioralPreference } from './matching.js';

export interface SemanticMatchOptions {
  readonly embeddingProvider?: EmbeddingProvider;
  readonly semanticWeight?: number;
}

export async function semanticScores(
  _queryText: string,
  _propertyTexts: readonly string[],
  options: SemanticMatchOptions = {},
): Promise<readonly number[]> {
  if (!options.embeddingProvider) return [];
  const query = await options.embeddingProvider.embed(_queryText);
  if (query.length !== 1536)
    throw new Error('Embedding provider returned an invalid dimension');
  return Promise.all(
    _propertyTexts.map(async (text) => {
      const vector = await options.embeddingProvider!.embed(text);
      if (vector.length !== 1536)
        throw new Error('Embedding provider returned an invalid dimension');
      let dot = 0;
      let queryNorm = 0;
      let vectorNorm = 0;
      for (let index = 0; index < query.length; index += 1) {
        dot += query[index]! * vector[index]!;
        queryNorm += query[index]! ** 2;
        vectorNorm += vector[index]! ** 2;
      }
      return queryNorm === 0 || vectorNorm === 0
        ? 0
        : dot / Math.sqrt(queryNorm * vectorNorm);
    }),
  );
}

export function applySemanticBoost<T>(
  results: Array<{ property: T; score: number; explanation: string[] }>,
  semanticScores: readonly number[],
  weight = 5,
) {
  return results
    .map((result, index) => ({
      ...result,
      score: result.score + (semanticScores[index] ?? 0) * weight,
      explanation:
        (semanticScores[index] ?? 0) > 0.7
          ? [...result.explanation, 'Strong semantic match']
          : result.explanation,
    }))
    .sort((a, b) => b.score - a.score);
}

export type { BehavioralPreference };
