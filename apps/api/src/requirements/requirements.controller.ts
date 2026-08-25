import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  locationResolveSchema,
  requirementBatchUpdateSchema,
  searchCreateSchema,
  uuidSchema,
} from '@property-assistant/types';
import { ProductionAdminGuard } from '../auth/role.guards.js';
import { parseRequest } from '../common/request.js';
import { LocationResolutionService } from './location-resolution.service.js';
import { RequirementsService } from './requirements.service.js';

@Controller()
@UseGuards(ProductionAdminGuard)
export class RequirementsController {
  constructor(
    @Inject(RequirementsService)
    private readonly requirements: RequirementsService,
    @Inject(LocationResolutionService)
    private readonly locations: LocationResolutionService,
  ) {}

  @Post('searches')
  createSearch(@Body() body: unknown) {
    return this.requirements.createSearch(
      parseRequest(searchCreateSchema, body),
    );
  }

  @Get('searches/:id/requirements')
  getState(@Param('id') id: string) {
    return this.requirements.getState(parseRequest(uuidSchema, id));
  }

  @Patch('searches/:id/requirements')
  update(@Param('id') id: string, @Body() body: unknown) {
    const parsed = parseRequest(requirementBatchUpdateSchema, body);
    return this.requirements.update(
      parseRequest(uuidSchema, id),
      parsed.requirements,
    );
  }

  @Post('locations/resolve')
  resolveLocation(@Body() body: unknown) {
    return this.locations.resolve(parseRequest(locationResolveSchema, body));
  }
}
