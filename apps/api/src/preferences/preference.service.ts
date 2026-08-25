import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type {
  PreferenceCreate,
  PreferenceListQuery,
  PreferenceUpdate,
} from '@property-assistant/types';
import { PreferenceRepository } from './preference.repository.js';

@Injectable()
export class PreferenceService {
  constructor(
    @Inject(PreferenceRepository)
    private readonly repository: PreferenceRepository,
  ) {}
  list(query: PreferenceListQuery) {
    return this.repository.list(query);
  }
  async get(id: string) {
    const result = await this.repository.findById(id);
    if (!result) throw new NotFoundException('Preference not found');
    return result;
  }
  create(input: PreferenceCreate) {
    return this.repository.create(input);
  }
  async update(id: string, input: PreferenceUpdate) {
    const result = await this.repository.update(id, input);
    if (!result) throw new NotFoundException('Preference not found');
    return result;
  }
  async remove(id: string) {
    if (!(await this.repository.remove(id)))
      throw new NotFoundException('Preference not found');
  }
}
