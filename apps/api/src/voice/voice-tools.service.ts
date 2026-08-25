import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { parseRequest } from '../common/request.js';
import { DatabaseService } from '../database/database.service.js';
import { LocationResolutionService } from '../requirements/location-resolution.service.js';

import { RequirementsService } from '../requirements/requirements.service.js';
import { PropertySearchService } from '../properties/property-search.service.js';
import { UsersService } from '../users/users.service.js';
import { WhatsAppDeliveryService } from '../whatsapp/whatsapp-delivery.service.js';
import { requirementBatchUpdateSchema } from '@property-assistant/types';
import type {
  VoiceToolRequest,
  VoiceToolResponse,
} from '@property-assistant/types';

@Injectable()
export class VoiceToolsService {
  constructor(
    @Inject(UsersService) private readonly users: UsersService,
    @Inject(RequirementsService)
    private readonly requirements: RequirementsService,
    @Inject(LocationResolutionService)
    private readonly locations: LocationResolutionService,
    @Inject(PropertySearchService)
    private readonly propertySearch: PropertySearchService,
    @Inject(DatabaseService) private readonly database: DatabaseService,
    @Inject(WhatsAppDeliveryService)
    private readonly whatsapp: WhatsAppDeliveryService,
  ) {}

  async initializeCallContext(callerPhone: string) {
    const user = await this.database.client
      .insertInto('users')
      .values({
        phone: callerPhone,
        normalized_phone: callerPhone,
        phone_number: callerPhone,
        whatsapp_number: callerPhone,
      })
      .onConflict((conflict) =>
        conflict.column('normalized_phone').doUpdateSet({
          updated_at: new Date(),
        }),
      )
      .returning(['id', 'phone', 'name'])
      .executeTakeFirstOrThrow();
    const search = await this.requirements.createSearch({ userId: user.id });
    return {
      userId: user.id,
      searchId: search.id,
      callerPhone: user.phone,
    };
  }

  async invoke(request: VoiceToolRequest, token: string | undefined) {
    const expected = process.env.INTERNAL_API_TOKEN;
    if (!expected || token !== expected)
      throw new UnauthorizedException('Invalid internal tool token');
    const data = await this.execute(request);
    return { ok: true, tool: request.tool, data } satisfies VoiceToolResponse;
  }

  private async execute(request: VoiceToolRequest) {
    switch (request.tool) {
      case 'initializeCallContext':
        return this.initializeCallContext(request.callerPhone);
      case 'getUser':
        return this.users.get(request.userId);
      case 'updateRequirement':
        return this.requirements.update(
          request.searchId,
          parseRequest(requirementBatchUpdateSchema, {
            requirements: request.requirements,
          }).requirements,
        );
      case 'resolveLocation':
        return this.locations.resolve(request);
      case 'getRequirementState':
        return this.requirements.getState(request.searchId);
      case 'searchCandidates':
        return this.propertySearch.search(request.searchId, request);
      case 'getMatchCount': {
        const result = await this.propertySearch.search(request.searchId, {
          limit: 1,
          offset: 0,
          radiusMeters: 100_000,
        });
        return { count: result.total };
      }
      case 'sendMatchesToWhatsApp': {
        const result = await this.whatsapp.deliverNextForSearch(
          request.userId,
          request.searchId,
          request.limit,
        );
        return {
          searchId: result.searchId,
          deliveredCount: result.delivered.length,
        };
      }
      case 'finishRequirementCollection': {
        const state = await this.requirements.getState(request.searchId);
        return { ready: state.ready, missing: state.missing };
      }
    }
  }
}
