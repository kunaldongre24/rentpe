import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type {
  Pagination,
  PropertyCreate,
  PropertyUpdate,
} from '@property-assistant/types';
import { PropertiesRepository } from './properties.repository.js';

@Injectable()
export class PropertiesService {
  constructor(
    @Inject(PropertiesRepository)
    private readonly repository: PropertiesRepository,
  ) {}
  list(p: Pagination) {
    return this.repository.list(p);
  }
  async get(id: string) {
    const result = await this.repository.findById(id);
    if (!result) throw new NotFoundException('Property not found');
    return result;
  }
  create(i: PropertyCreate) {
    return this.repository.create(i);
  }
  async update(id: string, i: PropertyUpdate) {
    const result = await this.repository.update(id, i);
    if (!result) throw new NotFoundException('Property not found');
    return result;
  }
  async remove(id: string) {
    if (!(await this.repository.softDelete(id)))
      throw new NotFoundException('Property not found');
  }
}
