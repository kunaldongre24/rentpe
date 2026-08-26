import {
  Injectable,
  Logger,
  OnApplicationShutdown,
  OnModuleInit,
} from '@nestjs/common';
import {
  checkDatabase,
  createDatabase,
  readDatabaseConfig,
} from '@property-assistant/database';

@Injectable()
export class DatabaseService implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(DatabaseService.name);
  private clientInstance?: ReturnType<typeof createDatabase>;

  async onModuleInit(): Promise<void> {
    this.logger.log('Validating database connection at startup');
    await this.check();
    this.logger.log('Database connection verified');
  }

  get client(): ReturnType<typeof createDatabase> {
    this.clientInstance ??= createDatabase(readDatabaseConfig(process.env));
    return this.clientInstance;
  }

  async check(): Promise<void> {
    await checkDatabase(this.client);
  }

  async onApplicationShutdown(): Promise<void> {
    await this.clientInstance?.destroy();
  }
}
