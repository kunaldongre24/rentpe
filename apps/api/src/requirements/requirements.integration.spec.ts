import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { AppModule } from '../app.module.js';

const enabled = Boolean(process.env.DATABASE_URL);
type JsonBody = Record<string, unknown>;

describe.runIf(enabled)('requirement engine integration', () => {
  let app: INestApplication;
  let searchId: string;
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
    await app.close();
  });

  it('resolves a seeded location alias without asking for city', async () => {
    const response = await http()
      .post('/api/locations/resolve')
      .send({ query: 'HSR' });
    expect(response.status).toBe(201);
    const body = response.body as JsonBody;
    expect(body.status).toBe('KNOWN');
    expect((body.location as JsonBody).city).toBe('Bengaluru');
  });

  it('creates and updates confidence-aware requirement state', async () => {
    const user = await http()
      .post('/api/users')
      .send({
        phone: `+918${Date.now().toString().slice(-9)}`,
        name: 'Requirement Integration User',
      });
    expect(user.status).toBe(201);
    const createdSearch = await http()
      .post('/api/searches')
      .send({ userId: (user.body as JsonBody).id });
    expect(createdSearch.status).toBe(201);
    searchId = (createdSearch.body as JsonBody).id as string;

    const updated = await http()
      .patch(`/api/searches/${searchId}/requirements`)
      .send({
        requirements: [
          {
            key: 'city',
            value: 'Bengaluru',
            confidence: 0.99,
            source: 'inferred',
            preferenceType: 'required',
          },
          {
            key: 'locality',
            value: 'HSR Layout',
            confidence: 0.97,
            source: 'inferred',
            preferenceType: 'required',
          },
          {
            key: 'bhk',
            value: 2,
            confidence: 0.99,
            source: 'explicit',
            preferenceType: 'required',
          },
          {
            key: 'max_rent',
            value: 35000,
            confidence: 0.99,
            source: 'explicit',
            preferenceType: 'required',
          },
          {
            key: 'property_type',
            value: 'apartment',
            confidence: 0.7,
            source: 'inferred',
            preferenceType: 'required',
          },
          {
            key: 'availability',
            value: '2030-09-01',
            confidence: 0.99,
            source: 'explicit',
            preferenceType: 'required',
          },
        ],
      });
    expect(updated.status).toBe(200);
    const body = updated.body as JsonBody;
    expect(body.needsConfirmation).toEqual(['property_type']);
    expect(body.missing).toEqual(['property_type']);
    expect(body.ready).toBe(false);

    const confirmed = await http()
      .patch(`/api/searches/${searchId}/requirements`)
      .send({
        requirements: [
          {
            key: 'property_type',
            value: 'apartment',
            confidence: 1,
            source: 'explicit',
            preferenceType: 'required',
          },
        ],
      });
    expect(confirmed.status).toBe(200);
    expect((confirmed.body as JsonBody).ready).toBe(true);
  });
});
