import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type {
  BrokerCreate,
  BrokerUpdate,
  Pagination,
} from '@property-assistant/types';
import { BrokersRepository } from './brokers.repository.js';

@Injectable()
export class BrokersService {
  constructor(
    @Inject(BrokersRepository) private readonly repository: BrokersRepository,
  ) {}
  list(p: Pagination) {
    return this.repository.list(p);
  }
  async get(id: string) {
    const result = await this.repository.findById(id);
    if (!result) throw new NotFoundException('Broker not found');
    return result;
  }
  create(i: BrokerCreate) {
    return this.repository.create(i);
  }
  async update(id: string, i: BrokerUpdate) {
    const result = await this.repository.update(id, i);
    if (!result) throw new NotFoundException('Broker not found');
    return result;
  }
  async remove(id: string) {
    if (!(await this.repository.remove(id)))
      throw new NotFoundException('Broker not found');
  }
}
