import { Kysely, PostgresDialect, sql } from 'kysely';
import { Pool } from 'pg';
import type { Database } from './types.js';
import type { DatabaseConfig } from './config.js';

export function createDatabase(config: DatabaseConfig): Kysely<Database> {
  const connection = new URL(config.connectionString);
  const sslMode = connection.searchParams.get('sslmode');
  const ssl = sslMode === 'require' ? { rejectUnauthorized: false } : undefined;
  if (sslMode === 'require') connection.searchParams.delete('sslmode');
  return new Kysely<Database>({
    dialect: new PostgresDialect({
      pool: new Pool({
        ...config,
        connectionString: connection.toString(),
        ssl,
      }),
    }),
  });
}

export async function checkDatabase(database: Kysely<Database>): Promise<void> {
  await sql`select 1`.execute(database);
}
