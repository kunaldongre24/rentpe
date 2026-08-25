import '../env.js';
import { sql } from 'kysely';
import { migrationContext } from './shared.js';
const { database, migrator } = migrationContext();
try {
  const migrations = await migrator.getMigrations();
  const extensions = await sql<{
    extname: string;
    extversion: string;
  }>`select extname, extversion from pg_extension where extname in ('postgis','vector','citext','pgcrypto') order by extname`.execute(
    database,
  );
  console.log(
    JSON.stringify(
      {
        migrations: migrations.map((item) => ({
          name: item.name,
          executedAt: item.executedAt,
        })),
        extensions: extensions.rows,
      },
      null,
      2,
    ),
  );
} finally {
  await database.destroy();
}
