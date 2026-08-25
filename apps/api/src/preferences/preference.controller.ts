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
  preferenceCreateSchema,
  preferenceListQuerySchema,
  preferenceUpdateSchema,
  uuidSchema,
} from '@property-assistant/types';
import { parseRequest } from '../common/request.js';
import { PreferenceService } from './preference.service.js';

@Controller('preferences')
export class PreferenceController {
  constructor(private readonly preferences: PreferenceService) {}
  @Get() list(@Query() query: unknown) {
    return this.preferences.list(
      parseRequest(preferenceListQuerySchema, query),
    );
  }
  @Get(':id') get(@Param('id') id: string) {
    return this.preferences.get(parseRequest(uuidSchema, id));
  }
  @Post() create(@Body() body: unknown) {
    return this.preferences.create(parseRequest(preferenceCreateSchema, body));
  }
  @Patch(':id') update(@Param('id') id: string, @Body() body: unknown) {
    return this.preferences.update(
      parseRequest(uuidSchema, id),
      parseRequest(preferenceUpdateSchema, body),
    );
  }
  @Delete(':id') async remove(@Param('id') id: string): Promise<void> {
    await this.preferences.remove(parseRequest(uuidSchema, id));
  }
}
