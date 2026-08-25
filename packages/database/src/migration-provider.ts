import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { FileMigrationProvider } from 'kysely';

export function createMigrationProvider(): FileMigrationProvider {
  const migrationFolder = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    'migrations',
  );
  const migrationPath = {
    join: (...parts: string[]) => pathToFileURL(path.join(...parts)).href,
  };
  return new FileMigrationProvider({
    fs,
    path: migrationPath,
    migrationFolder,
  });
}
