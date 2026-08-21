import { sql } from 'kysely';
import { migrationContext } from './shared.js';

const { database: db } = migrationContext();
function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
try {
  const version = await sql<{
    version: string;
  }>`select current_setting('server_version') version`.execute(db);
  assert(
    version.rows[0]?.version.startsWith('15.'),
    `Expected PostgreSQL 15, got ${version.rows[0]?.version}`,
  );
  const extensions = await sql<{
    extname: string;
  }>`select extname from pg_extension where extname in ('postgis','vector','citext','pgcrypto')`.execute(
    db,
  );
  assert(
    extensions.rows.length === 4,
    'Required PostgreSQL extensions are missing',
  );
  const counts = await sql<{
    locations: string;
    brokers: string;
    properties: string;
    propertyImages: string;
  }>`select (select count(*) from locations)::text locations, (select count(*) from brokers)::text brokers, (select count(*) from properties)::text properties, (select count(*) from property_images)::text "propertyImages"`.execute(
    db,
  );
  assert(
    counts.rows[0]?.locations === '10' &&
      counts.rows[0]?.brokers === '20' &&
      counts.rows[0]?.properties === '120' &&
      counts.rows[0]?.propertyImages === '120',
    `Unexpected seed counts: ${JSON.stringify(counts.rows[0])}`,
  );
  const duplicates = await sql<{
    count: string;
  }>`select count(*)::text count from (select id from brokers group by id having count(*) > 1 union all select id from properties group by id having count(*) > 1) duplicates`.execute(
    db,
  );
  assert(
    duplicates.rows[0]?.count === '0',
    'Deterministic seed identifiers are duplicated',
  );
  console.log(
    JSON.stringify(
      {
        postgres: version.rows[0]?.version,
        extensions: extensions.rows.map((row) => row.extname),
        counts: counts.rows[0],
      },
      null,
      2,
    ),
  );
} finally {
  await db.destroy();
}
