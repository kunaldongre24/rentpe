import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type {
  LocationCreate,
  LocationUpdate,
  Pagination,
} from '@property-assistant/types';
import { LocationsRepository } from './locations.repository.js';

@Injectable()
export class LocationsService {
  constructor(
    @Inject(LocationsRepository)
    private readonly repository: LocationsRepository,
  ) {}
  list(p: Pagination) {
    return this.repository.list(p);
  }
  async get(id: string) {
    const result = await this.repository.findById(id);
    if (!result) throw new NotFoundException('Location not found');
    return result;
  }
  create(i: LocationCreate) {
    return this.repository.create(i);
  }
  async update(id: string, i: LocationUpdate) {
    const result = await this.repository.update(id, i);
    if (!result) throw new NotFoundException('Location not found');
    return result;
  }
  async remove(id: string) {
    if (!(await this.repository.remove(id)))
      throw new NotFoundException('Location not found');
  }
}
