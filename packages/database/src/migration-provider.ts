import { promises as fs } from 'node:fs';
import path from 'node:path';
import { FileMigrationProvider } from 'kysely';

export function createMigrationProvider(): FileMigrationProvider {
  const migrationFolder = path.join(
    path.dirname(new URL(import.meta.url).pathname.replace(/^\/(.:)/, '$1')),
    'migrations',
  );
  return new FileMigrationProvider({ fs, path, migrationFolder });
}
