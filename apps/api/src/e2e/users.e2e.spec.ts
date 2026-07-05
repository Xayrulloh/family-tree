/// <reference types="jest" />
import type { INestApplication } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import type supertest from 'supertest';
import { createE2EApp, signToken } from '~/test/create-e2e-app';
import { seedUser } from '~/test/seeds';
import { getTestDb, truncateTables } from '~/test/test-db';

describe('Users (E2E)', () => {
  let app: INestApplication;
  let req: ReturnType<typeof supertest>;
  let jwtService: JwtService;

  beforeAll(async () => {
    ({ app, req, jwtService } = await createE2EApp());
  });

  beforeEach(async () => {
    await truncateTables();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/users/me', () => {
    it('returns 401 without a token', async () => {
      await req.get('/api/users/me').expect(401);
    });

    it('returns own user data with a valid token', async () => {
      const user = await seedUser(getTestDb());
      const token = await signToken(jwtService, user);

      const res = await req
        .get('/api/users/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.id).toBe(user.id);
      expect(res.body.email).toBe(user.email);
    });
  });

  describe('GET /api/users/:id', () => {
    it('returns 401 without a token', async () => {
      await req.get('/api/users/some-id').expect(401);
    });

    it('returns user data for an existing user', async () => {
      const user = await seedUser(getTestDb());
      const token = await signToken(jwtService, user);

      const res = await req
        .get(`/api/users/${user.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.id).toBe(user.id);
    });

    it('returns 404 for a non-existent user', async () => {
      const user = await seedUser(getTestDb());
      const token = await signToken(jwtService, user);

      await req
        .get('/api/users/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });

  describe('PUT /api/users', () => {
    it('returns 401 without a token', async () => {
      await req.put('/api/users').send({ name: 'New Name' }).expect(401);
    });

    it('returns 204 and persists the change', async () => {
      const user = await seedUser(getTestDb());
      const token = await signToken(jwtService, user);

      await req
        .put('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated Name' })
        .expect(204);

      const res = await req
        .get('/api/users/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.name).toBe('Updated Name');
    });
  });
});
