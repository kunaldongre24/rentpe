import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Inject,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  listingStatusUpdateSchema,
  paginationSchema,
  propertyCreateSchema,
  propertyUpdateSchema,
  uuidSchema,
} from '@property-assistant/types';
import { parseRequest } from '../common/request.js';
import {
  DashboardAuthGuard,
  type DashboardRequest,
  requireDashboardAccount,
} from '../auth/dashboard-auth.guard.js';
import { PartnerGuard } from '../auth/role.guards.js';
import { PropertiesService } from './properties.service.js';
import { ListingAuditRepository } from './listing-audit.repository.js';

@Controller('partner/properties')
@UseGuards(DashboardAuthGuard, PartnerGuard)
export class PartnerPropertiesController {
  constructor(
    @Inject(PropertiesService) private readonly properties: PropertiesService,
    @Inject(ListingAuditRepository)
    private readonly audit: ListingAuditRepository,
  ) {}

  @Get()
  async list(
    @Req() request: DashboardRequest,
    @Headers('x-limit') limit?: string,
  ) {
    const account = requireDashboardAccount(request);
    return this.properties.list(
      parseRequest(paginationSchema, { limit: limit ?? 100, offset: 0 }),
      account.role === 'ADMIN' ? undefined : account.brokerId!,
    );
  }

  @Post()
  async create(@Req() request: DashboardRequest, @Body() body: unknown) {
    const account = requireDashboardAccount(request);
    const input = parseRequest(propertyCreateSchema, body);
    if (account.role !== 'ADMIN' && input.brokerId !== account.brokerId)
      throw new ForbiddenException(
        'Property must belong to the authenticated partner',
      );
    const property = await this.properties.create(input);
    await this.audit.record({
      propertyId: property.id,
      actorAccountId: account.id,
      action: 'PROPERTY_CREATED',
      newStatus: property.status,
    });
    return property;
  }

  @Patch(':id/status')
  async updateStatus(
    @Req() request: DashboardRequest,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const account = requireDashboardAccount(request);
    const property = await this.properties.get(parseRequest(uuidSchema, id));
    if (account.role !== 'ADMIN' && property.broker_id !== account.brokerId)
      throw new ForbiddenException(
        'Property does not belong to the authenticated partner',
      );
    const status = parseRequest(listingStatusUpdateSchema, body).status;
    if (
      account.role !== 'ADMIN' &&
      !['DRAFT', 'PAUSED', 'RENTED'].includes(status)
    )
      throw new ForbiddenException(
        'Only an admin can activate or expire a listing',
      );
    const updated = await this.properties.update(property.id, { status });
    await this.audit.record({
      propertyId: property.id,
      actorAccountId: account.id,
      action: 'PROPERTY_STATUS_UPDATED',
      previousStatus: property.status,
      newStatus: updated.status,
    });
    return updated;
  }

  @Patch(':id')
  async update(
    @Req() request: DashboardRequest,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const account = requireDashboardAccount(request);
    const property = await this.properties.get(parseRequest(uuidSchema, id));
    if (account.role !== 'ADMIN' && property.broker_id !== account.brokerId)
      throw new ForbiddenException(
        'Property does not belong to the authenticated partner',
      );
    const input = parseRequest(propertyUpdateSchema, body);
    if (
      account.role !== 'ADMIN' &&
      input.brokerId !== undefined &&
      input.brokerId !== account.brokerId
    )
      throw new ForbiddenException('Property ownership cannot be changed');
    const updated = await this.properties.update(property.id, input);
    await this.audit.record({
      propertyId: property.id,
      actorAccountId: account.id,
      action: 'PROPERTY_UPDATED',
      previousStatus: property.status,
      newStatus: updated.status,
    });
    return updated;
  }
}
