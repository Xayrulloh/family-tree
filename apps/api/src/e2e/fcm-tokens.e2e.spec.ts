/// <reference types="jest" />
import { FCMTokenDeviceEnum } from '@family-tree/shared';
import type { INestApplication } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import type supertest from 'supertest';
import { createE2EApp, signToken } from '~/test/create-e2e-app';
import { seedUser } from '~/test/seeds';
import { getTestDb, truncateTables } from '~/test/test-db';

describe('FCM Tokens (E2E)', () => {
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

  describe('POST /api/fcm-tokens', () => {
    it('returns 401 without a token', async () => {
      await req
        .post('/api/fcm-tokens')
        .send({ token: 'fcm-abc', deviceType: FCMTokenDeviceEnum.WEB })
        .expect(401);
    });

    it('creates an FCM token bound to the authenticated user', async () => {
      const user = await seedUser(getTestDb());
      const token = await signToken(jwtService, user);

      const res = await req
        .post('/api/fcm-tokens')
        .set('Authorization', `Bearer ${token}`)
        .send({ token: 'fcm-abc', deviceType: FCMTokenDeviceEnum.WEB })
        .expect(201);

      expect(res.body.token).toBe('fcm-abc');
      expect(res.body.deviceType).toBe(FCMTokenDeviceEnum.WEB);
      expect(res.body.userId).toBe(user.id);
    });

    it('rejects an unknown deviceType with 400', async () => {
      const user = await seedUser(getTestDb());
      const token = await signToken(jwtService, user);

      await req
        .post('/api/fcm-tokens')
        .set('Authorization', `Bearer ${token}`)
        .send({ token: 'fcm-abc', deviceType: 'DESKTOP' })
        .expect(400);
    });
  });

  describe('DELETE /api/fcm-tokens', () => {
    it('returns 401 without a token', async () => {
      await req
        .delete('/api/fcm-tokens')
        .send({ token: 'fcm-abc', deviceType: FCMTokenDeviceEnum.WEB })
        .expect(401);
    });

    it('deletes a previously created token and returns 204', async () => {
      const user = await seedUser(getTestDb());
      const token = await signToken(jwtService, user);
      const body = { token: 'fcm-abc', deviceType: FCMTokenDeviceEnum.WEB };

      await req
        .post('/api/fcm-tokens')
        .set('Authorization', `Bearer ${token}`)
        .send(body)
        .expect(201);

      await req
        .delete('/api/fcm-tokens')
        .set('Authorization', `Bearer ${token}`)
        .send(body)
        .expect(204);
    });
  });
});
