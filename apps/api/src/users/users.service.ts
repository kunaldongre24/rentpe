import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type {
  Pagination,
  UserCreate,
  UserUpdate,
} from '@property-assistant/types';
import { UsersRepository } from './users.repository.js';

@Injectable()
export class UsersService {
  constructor(
    @Inject(UsersRepository) private readonly repository: UsersRepository,
  ) {}
  list(pagination: Pagination) {
    return this.repository.list(pagination);
  }
  async get(id: string) {
    const user = await this.repository.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
  create(input: UserCreate) {
    return this.repository.create(input);
  }
  async update(id: string, input: UserUpdate) {
    const user = await this.repository.update(id, input);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
  async remove(id: string) {
    if (!(await this.repository.remove(id)))
      throw new NotFoundException('User not found');
  }
}
