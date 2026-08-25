import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { AppModule } from '../app.module.js';

type JsonBody = Record<string, unknown>;
const enabled = Boolean(process.env.DATABASE_URL);

describe.runIf(enabled)('property search integration', () => {
  let app: INestApplication;
  const http = () => request(app.getHttpServer() as never);

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('applies hard filters, excludes inactive rows, paginates, and supports radius', async () => {
    const user = await http()
      .post('/api/users')
      .send({
        phone: `+917${Date.now().toString().slice(-9)}`,
      });
    expect(user.status).toBe(201);
    const search = await http()
      .post('/api/searches')
      .send({ userId: (user.body as JsonBody).id });
    expect(search.status).toBe(201);
    const searchId = (search.body as JsonBody).id as string;

    const update = await http()
      .patch(`/api/searches/${searchId}/requirements`)
      .send({
        requirements: [
          {
            key: 'city',
            value: 'Bengaluru',
            confidence: 1,
            preferenceType: 'required',
          },
          {
            key: 'locality',
            value: 'HSR Layout',
            confidence: 1,
            preferenceType: 'required',
          },
          { key: 'bhk', value: 2, confidence: 1, preferenceType: 'required' },
          {
            key: 'max_rent',
            value: 35000,
            confidence: 1,
            preferenceType: 'required',
          },
          {
            key: 'property_type',
            value: 'apartment',
            confidence: 1,
            preferenceType: 'required',
          },
          {
            key: 'availability',
            value: '2030-01-01',
            confidence: 1,
            preferenceType: 'required',
          },
        ],
      });
    expect(update.status).toBe(200);

    const response = await http()
      .get(`/api/properties/search/${searchId}`)
      .query({
        limit: 2,
        offset: 0,
        latitude: 12.9116,
        longitude: 77.6389,
        radiusMeters: 2_000,
      });
    expect(response.status).toBe(200);
    const body = response.body as JsonBody;
    const properties = body.properties as JsonBody[];
    expect(properties.length).toBeGreaterThan(0);
    expect(properties.length).toBeLessThanOrEqual(2);
    for (const property of properties) {
      expect(property.status).toBe('ACTIVE');
      expect(property.city).toBe('Bengaluru');
      expect(property.locality).toBe('HSR Layout');
      expect(property.bhk).toBe(2);
      expect(Number(property.rent)).toBeLessThanOrEqual(35000);
    }
  }, 30_000);
});
