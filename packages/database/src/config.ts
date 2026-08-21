export interface DatabaseConfig {
  connectionString: string;
  max: number;
  idleTimeoutMillis: number;
  connectionTimeoutMillis: number;
}

function positiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value ?? fallback);
  if (!Number.isInteger(parsed) || parsed <= 0)
    throw new Error('Database pool settings must be positive integers');
  return parsed;
}

export function readDatabaseConfig(
  environment: NodeJS.ProcessEnv,
  purpose: 'runtime' | 'migration' = 'runtime',
): DatabaseConfig {
  const connectionString =
    purpose === 'migration'
      ? environment.MIGRATION_DATABASE_URL || environment.DATABASE_URL
      : environment.DATABASE_URL;
  if (!connectionString)
    throw new Error(
      `${purpose === 'migration' ? 'MIGRATION_DATABASE_URL or ' : ''}DATABASE_URL is required`,
    );
  if (
    purpose === 'migration' &&
    environment.NODE_ENV === 'production' &&
    !environment.MIGRATION_DATABASE_URL
  )
    throw new Error('MIGRATION_DATABASE_URL is required in production');
  return {
    connectionString,
    max: positiveInteger(environment.DATABASE_POOL_MAX, 10),
    idleTimeoutMillis: positiveInteger(
      environment.DATABASE_IDLE_TIMEOUT_MS,
      30_000,
    ),
    connectionTimeoutMillis: positiveInteger(
      environment.DATABASE_CONNECT_TIMEOUT_MS,
      5_000,
    ),
  };
}
