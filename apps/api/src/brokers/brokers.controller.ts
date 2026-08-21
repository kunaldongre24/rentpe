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
  brokerCreateSchema,
  brokerUpdateSchema,
  paginationSchema,
  uuidSchema,
} from '@property-assistant/types';
import { parseRequest } from '../common/request.js';
import { BrokersService } from './brokers.service.js';

@Controller('brokers')
export class BrokersController {
  constructor(
    @Inject(BrokersService) private readonly brokers: BrokersService,
  ) {}

  @Get()
  list(@Query() query: unknown) {
    return this.brokers.list(parseRequest(paginationSchema, query));
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.brokers.get(parseRequest(uuidSchema, id));
  }

  @Post()
  create(@Body() body: unknown) {
    return this.brokers.create(parseRequest(brokerCreateSchema, body));
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: unknown) {
    return this.brokers.update(
      parseRequest(uuidSchema, id),
      parseRequest(brokerUpdateSchema, body),
    );
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    await this.brokers.remove(parseRequest(uuidSchema, id));
  }
}
