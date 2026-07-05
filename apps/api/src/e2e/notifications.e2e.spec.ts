/// <reference types="jest" />
import type { INestApplication } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import type supertest from 'supertest';
import { createE2EApp, signToken } from '~/test/create-e2e-app';
import { seedUser } from '~/test/seeds';
import { getTestDb, truncateTables } from '~/test/test-db';

describe('Notifications (E2E)', () => {
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

  describe('GET /api/notifications', () => {
    it('returns 401 without a token', async () => {
      await req.get('/api/notifications').expect(401);
    });

    it('returns an empty list for a user with no notifications', async () => {
      const user = await seedUser(getTestDb());
      const token = await signToken(jwtService, user);

      const res = await req
        .get('/api/notifications')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.unReadNotifications).toHaveLength(0);
      expect(res.body.last5Notifications).toHaveLength(0);
    });
  });
});
