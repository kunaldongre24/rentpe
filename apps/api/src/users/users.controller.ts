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
  paginationSchema,
  userCreateSchema,
  userUpdateSchema,
  uuidSchema,
} from '@property-assistant/types';
import { ProductionAdminGuard } from '../auth/role.guards.js';
import { parseRequest } from '../common/request.js';
import { UsersService } from './users.service.js';

@Controller('users')
@UseGuards(ProductionAdminGuard)
export class UsersController {
  constructor(@Inject(UsersService) private readonly users: UsersService) {}

  @Get()
  list(@Query() query: unknown) {
    return this.users.list(parseRequest(paginationSchema, query));
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.users.get(parseRequest(uuidSchema, id));
  }

  @Post()
  create(@Body() body: unknown) {
    return this.users.create(parseRequest(userCreateSchema, body));
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: unknown) {
    return this.users.update(
      parseRequest(uuidSchema, id),
      parseRequest(userUpdateSchema, body),
    );
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    await this.users.remove(parseRequest(uuidSchema, id));
  }
}
