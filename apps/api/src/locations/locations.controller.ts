import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  locationCreateSchema,
  locationUpdateSchema,
  paginationSchema,
  uuidSchema,
} from '@property-assistant/types';
import { ProductionAdminGuard } from '../auth/role.guards.js';
import { parseRequest } from '../common/request.js';
import { LocationsService } from './locations.service.js';

@Controller('locations')
@UseGuards(ProductionAdminGuard)
export class LocationsController {
  constructor(
    @Inject(LocationsService) private readonly locations: LocationsService,
  ) {}

  @Get()
  list(@Query() query: unknown) {
    return this.locations.list(parseRequest(paginationSchema, query));
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.locations.get(parseRequest(uuidSchema, id));
  }

  @Post()
  create(@Body() body: unknown) {
    return this.locations.create(parseRequest(locationCreateSchema, body));
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: unknown) {
    return this.locations.update(
      parseRequest(uuidSchema, id),
      parseRequest(locationUpdateSchema, body),
    );
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    await this.locations.remove(parseRequest(uuidSchema, id));
  }
}
