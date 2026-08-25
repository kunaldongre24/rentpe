import { Inject, Injectable } from '@nestjs/common';
import type { PropertyFeedbackInput } from '@property-assistant/types';
import { DatabaseService } from '../database/database.service.js';

@Injectable()
export class FeedbackRepository {
  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
  ) {}
  create(input: PropertyFeedbackInput) {
    return this.database.client
      .insertInto('property_feedback')
      .values({
        user_id: input.userId,
        search_id: input.searchId,
        property_id: input.propertyId ?? null,
        feedback_type: input.feedbackType,
        feedback_text: input.feedbackText ?? null,
        structured_feedback: JSON.stringify(input.structuredFeedback ?? {}),
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }
  findForUser(userId: string, limit = 50) {
    return this.database.client
      .selectFrom('property_feedback')
      .selectAll()
      .where('user_id', '=', userId)
      .orderBy('created_at', 'desc')
      .limit(limit)
      .execute();
  }
}
