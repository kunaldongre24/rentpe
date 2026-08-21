import { seedDatabase, type SeedStats } from '../seed.js';

function assertInitial(stats: SeedStats): void {
  const expected = {
    locationsInserted: 10,
    brokersInserted: 20,
    propertiesInserted: 120,
    propertyImagesInserted: 120,
    inserted: 270,
    updated: 0,
    skipped: 0,
  };
  for (const [key, value] of Object.entries(expected)) {
    if (stats[key as keyof SeedStats] !== value)
      throw new Error(
        `Initial seed statistic ${key} expected ${value}, got ${stats[key as keyof SeedStats]}`,
      );
  }
}

function assertIdempotent(stats: SeedStats): void {
  const expected = {
    locationsSkipped: 10,
    brokersSkipped: 20,
    propertiesSkipped: 120,
    propertyImagesSkipped: 120,
    inserted: 0,
    updated: 0,
    skipped: 270,
  };
  for (const [key, value] of Object.entries(expected)) {
    if (stats[key as keyof SeedStats] !== value)
      throw new Error(
        `Idempotent seed statistic ${key} expected ${value}, got ${stats[key as keyof SeedStats]}`,
      );
  }
}

const result = await seedDatabase();
if (process.env.SEED_EXPECTED_MODE === 'initial') assertInitial(result);
if (process.env.SEED_EXPECTED_MODE === 'idempotent') assertIdempotent(result);
if (
  process.env.SEED_EXPECTED_JSON &&
  JSON.stringify(result) !== process.env.SEED_EXPECTED_JSON
)
  throw new Error('Seed statistics did not match SEED_EXPECTED_JSON');
