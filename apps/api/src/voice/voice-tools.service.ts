import { Injectable, UnauthorizedException } from '@nestjs/common';
import { parseRequest } from '../common/request.js';
import { LocationResolutionService } from '../requirements/location-resolution.service.js';

import { RequirementsService } from '../requirements/requirements.service.js';
import { PropertySearchService } from '../properties/property-search.service.js';
import { UsersService } from '../users/users.service.js';
import { requirementBatchUpdateSchema } from '@property-assistant/types';
import type {
  VoiceToolRequest,
  VoiceToolResponse,
} from '@property-assistant/types';

@Injectable()
export class VoiceToolsService {
  constructor(
    private readonly users: UsersService,
    private readonly requirements: RequirementsService,
    private readonly locations: LocationResolutionService,
    private readonly propertySearch: PropertySearchService,
  ) {}

  async invoke(request: VoiceToolRequest, token: string | undefined) {
    const expected = process.env.INTERNAL_API_TOKEN;
    if (!expected || token !== expected)
      throw new UnauthorizedException('Invalid internal tool token');
    const data = await this.execute(request);
    return { ok: true, tool: request.tool, data } satisfies VoiceToolResponse;
  }

  private async execute(request: VoiceToolRequest) {
    switch (request.tool) {
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
          limit: 100,
          offset: 0,
          radiusMeters: 100_000,
        });
        return { count: result.properties.length };
      }
      case 'finishRequirementCollection': {
        const state = await this.requirements.getState(request.searchId);
        return { ready: state.ready, missing: state.missing };
      }
    }
  }
}
