import { migrationContext } from './shared.js';
const { database, migrator } = migrationContext();
try {
  const result = await migrator.migrateToLatest();
  for (const item of result.results ?? [])
    console.log(`${item.status}: ${item.migrationName}`);
  if (result.error)
    throw result.error instanceof Error
      ? result.error
      : new Error('Migration failed');
} finally {
  await database.destroy();
}
