import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { AppModule } from './app.module.js';

const enabled = Boolean(process.env.DATABASE_URL);
type UserResponse = { id: string; phone: string; name: string };

describe.runIf(enabled)('CRUD API integration', () => {
  let app: INestApplication;
  let userId: string;
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

  it('validates, creates, reads, updates, and deletes a user', async () => {
    const invalid = await http()
      .post('/api/users')
      .send({ phone: '9988776655' });
    expect(invalid.status).toBe(400);

    const phone = `+919${Date.now().toString().slice(-9)}`;
    const created = await http()
      .post('/api/users')
      .send({ phone, name: 'CRUD Integration User' });
    expect(created.status).toBe(201);
    const createdBody = created.body as unknown as UserResponse;
    expect(createdBody).toMatchObject({ phone, name: 'CRUD Integration User' });
    userId = createdBody.id;

    const fetched = await http().get(`/api/users/${userId}`);
    expect(fetched.status).toBe(200);
    const fetchedBody = fetched.body as unknown as UserResponse;
    expect(fetchedBody.id).toBe(userId);

    const updated = await http()
      .patch(`/api/users/${userId}`)
      .send({ name: 'Updated CRUD User' });
    expect(updated.status).toBe(200);
    const updatedBody = updated.body as unknown as UserResponse;
    expect(updatedBody.name).toBe('Updated CRUD User');

    const deleted = await http().delete(`/api/users/${userId}`);
    expect(deleted.status).toBe(200);

    const missing = await http().get(`/api/users/${userId}`);
    expect(missing.status).toBe(404);
  });

  it('supports paginated collection reads', async () => {
    const response = await http().get('/api/users?limit=1&offset=0');
    expect(response.status).toBe(200);
    const body = response.body as unknown;
    expect(Array.isArray(body)).toBe(true);
    expect((body as unknown[]).length).toBeLessThanOrEqual(1);
  });
});
