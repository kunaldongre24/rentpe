import { Kysely, PostgresDialect, sql } from 'kysely';
import { Pool } from 'pg';
import type { Database } from './types.js';
import type { DatabaseConfig } from './config.js';

export function createDatabase(config: DatabaseConfig): Kysely<Database> {
  return new Kysely<Database>({
    dialect: new PostgresDialect({ pool: new Pool(config) }),
  });
}

export async function checkDatabase(database: Kysely<Database>): Promise<void> {
  await sql`select 1`.execute(database);
}
