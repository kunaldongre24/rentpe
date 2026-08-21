import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { BrokersController } from './brokers.controller.js';
import { BrokersService } from './brokers.service.js';

@Module({
  imports: [DatabaseModule],
  controllers: [BrokersController],
  providers: [BrokersService],
})
export class BrokersModule {}
