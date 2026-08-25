import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { FeedbackController } from './feedback.controller.js';
import { FeedbackRepository } from './feedback.repository.js';
import { FeedbackService } from './feedback.service.js';

@Module({
  imports: [DatabaseModule],
  controllers: [FeedbackController],
  providers: [FeedbackRepository, FeedbackService],
})
export class FeedbackModule {}
