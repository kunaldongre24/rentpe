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
} from '@nestjs/common';
import {
  paginationSchema,
  propertyCreateSchema,
  propertyUpdateSchema,
  uuidSchema,
} from '@property-assistant/types';
import { parseRequest } from '../common/request.js';
import { PropertiesService } from './properties.service.js';

@Controller('properties')
export class PropertiesController {
  constructor(
    @Inject(PropertiesService) private readonly properties: PropertiesService,
  ) {}

  @Get()
  list(@Query() query: unknown) {
    return this.properties.list(parseRequest(paginationSchema, query));
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.properties.get(parseRequest(uuidSchema, id));
  }

  @Post()
  create(@Body() body: unknown) {
    return this.properties.create(parseRequest(propertyCreateSchema, body));
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: unknown) {
    return this.properties.update(
      parseRequest(uuidSchema, id),
      parseRequest(propertyUpdateSchema, body),
    );
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    await this.properties.remove(parseRequest(uuidSchema, id));
  }
}
