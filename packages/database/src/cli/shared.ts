import { Migrator } from 'kysely';
import { createDatabase } from '../client.js';
import { readDatabaseConfig } from '../config.js';
import { createMigrationProvider } from '../migration-provider.js';

export function migrationContext() {
  const database = createDatabase(readDatabaseConfig(process.env, 'migration'));
  return {
    database,
    migrator: new Migrator({
      db: database,
      provider: createMigrationProvider(),
    }),
  };
}
