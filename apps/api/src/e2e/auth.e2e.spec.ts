/// <reference types="jest" />
import type { INestApplication } from '@nestjs/common';
import type supertest from 'supertest';
import { createE2EApp } from '~/test/create-e2e-app';
import { truncateTables } from '~/test/test-db';

describe('Auth (E2E)', () => {
  let app: INestApplication;
  let req: ReturnType<typeof supertest>;

  beforeAll(async () => {
    ({ app, req } = await createE2EApp());
  });

  beforeEach(async () => {
    await truncateTables();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/auth/logout', () => {
    it('returns 200 and clears the access_token cookie', async () => {
      const res = await req.get('/api/auth/logout').expect(200);

      const setCookie: string[] = ([] as string[]).concat(
        res.headers['set-cookie'] ?? [],
      );

      const tokenCookie = setCookie.find((c) => c.startsWith('access_token='));

      expect(tokenCookie).toBeDefined();
      expect(tokenCookie).toMatch(/access_token=;|access_token=\s*;/);
    });
  });
});
