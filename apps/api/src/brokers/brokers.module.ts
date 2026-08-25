import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { BrokersController } from './brokers.controller.js';
import { BrokersRepository } from './brokers.repository.js';
import { BrokersService } from './brokers.service.js';

@Module({
  imports: [DatabaseModule],
  controllers: [BrokersController],
  providers: [BrokersRepository, BrokersService],
})
export class BrokersModule {}
