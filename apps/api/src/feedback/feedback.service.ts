import { Inject, Injectable } from '@nestjs/common';
import type { PropertyFeedbackInput } from '@property-assistant/types';
import { DatabaseService } from '../database/database.service.js';
import { FeedbackRepository } from './feedback.repository.js';

const positiveFeedback = new Set(['liked', 'shortlisted', 'contacted']);

@Injectable()
export class FeedbackService {
  constructor(
    @Inject(FeedbackRepository) private readonly repository: FeedbackRepository,
    @Inject(DatabaseService) private readonly database: DatabaseService,
  ) {}

  async record(input: PropertyFeedbackInput) {
    const feedback = await this.repository.create(input);
    if (input.propertyId && positiveFeedback.has(input.feedbackType))
      await this.learnFromProperty(
        input.userId,
        input.searchId,
        input.propertyId,
      );
    return feedback;
  }

  private async learnFromProperty(
    userId: string,
    searchId: string,
    propertyId: string,
  ) {
    const property = await this.database.client
      .selectFrom('properties')
      .select([
        'rent',
        'locality',
        'furnishing',
        'area',
        'amenities',
        'quality_score',
      ])
      .where('id', '=', propertyId)
      .executeTakeFirstOrThrow();
    const preferences = [
      ['preferred_rent', Number(property.rent)],
      ['preferred_locality', property.locality],
      ['preferred_furnishing', property.furnishing],
      ['preferred_area', Number(property.area)],
      ['preferred_amenities', property.amenities],
      ['preferred_property_quality', Number(property.quality_score)],
    ] as const;
    for (const [key, value] of preferences) {
      await this.database.client
        .insertInto('behavioral_preferences')
        .values({
          user_id: userId,
          search_id: searchId,
          preference_key: key,
          value: JSON.stringify(value),
          confidence: 0.6,
          evidence_count: 1,
          source: 'behavioral',
        })
        .onConflict((conflict) =>
          conflict
            .constraint('behavioral_preferences_scope_unique')
            .doUpdateSet((expression) => ({
              value: JSON.stringify(value),
              confidence: expression.fn('least', [
                expression.val(0.95),
                expression('behavioral_preferences.confidence', '+', 0.05),
              ]),
              evidence_count: expression(
                'behavioral_preferences.evidence_count',
                '+',
                1,
              ),
              updated_at: new Date(),
            })),
        )
        .execute();
    }
  }
}
