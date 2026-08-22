import { sql, type Kysely } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`alter table property_searches alter column city drop not null`.execute(
    db,
  );
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`update property_searches set city = 'UNKNOWN' where city is null`.execute(
    db,
  );
  await sql`alter table property_searches alter column city set not null`.execute(
    db,
  );
}
