import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import {
  checkDatabase,
  createDatabase,
  readDatabaseConfig,
} from '@property-assistant/database';

@Injectable()
export class DatabaseService implements OnApplicationShutdown {
  private clientInstance?: ReturnType<typeof createDatabase>;

  private get client(): ReturnType<typeof createDatabase> {
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
