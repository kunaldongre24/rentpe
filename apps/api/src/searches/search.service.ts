import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type {
  SearchCreate,
  SearchListQuery,
  SearchUpdate,
} from '@property-assistant/types';
import { SearchRepository } from './search.repository.js';

@Injectable()
export class SearchService {
  constructor(
    @Inject(SearchRepository) private readonly repository: SearchRepository,
  ) {}

  list(query: SearchListQuery) {
    return this.repository.list(query);
  }

  async get(id: string) {
    const search = await this.repository.findById(id);
    if (!search) throw new NotFoundException('Search not found');
    return search;
  }

  create(input: SearchCreate) {
    return this.repository.create(input);
  }

  async update(id: string, input: SearchUpdate) {
    const search = await this.repository.update(id, input);
    if (!search) throw new NotFoundException('Search not found');
    return search;
  }

  async remove(id: string) {
    if (!(await this.repository.remove(id)))
      throw new NotFoundException('Search not found');
  }
}
