import { sql } from 'kysely';
import { migrationContext } from './shared.js';
if (
  process.env.NODE_ENV === 'production' ||
  process.env.ALLOW_DATABASE_RESET !== 'true'
)
  throw new Error(
    'Database reset requires ALLOW_DATABASE_RESET=true and is forbidden in production',
  );
const { database, migrator } = migrationContext();
try {
  await sql`drop schema public cascade; create schema public`.execute(database);
  const result = await migrator.migrateToLatest();
  if (result.error)
    throw result.error instanceof Error
      ? result.error
      : new Error('Migration failed');
  console.log('Database reset and migrations completed');
} finally {
  await database.destroy();
}
