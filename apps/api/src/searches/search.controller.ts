import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  searchCreateSchema,
  searchListQuerySchema,
  searchUpdateSchema,
  uuidSchema,
} from '@property-assistant/types';
import { parseRequest } from '../common/request.js';
import { SearchService } from './search.service.js';

@Controller('searches')
export class SearchController {
  constructor(private readonly searches: SearchService) {}

  @Get()
  list(@Query() query: unknown) {
    return this.searches.list(parseRequest(searchListQuerySchema, query));
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.searches.get(parseRequest(uuidSchema, id));
  }

  @Post()
  create(@Body() body: unknown) {
    return this.searches.create(parseRequest(searchCreateSchema, body));
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: unknown) {
    return this.searches.update(
      parseRequest(uuidSchema, id),
      parseRequest(searchUpdateSchema, body),
    );
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    await this.searches.remove(parseRequest(uuidSchema, id));
  }
}
