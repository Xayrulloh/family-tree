/// <reference types="jest" />
import type { INestApplication } from '@nestjs/common';
import type supertest from 'supertest';
import { createE2EApp } from '~/test/create-e2e-app';
import { seedFamilyTree, seedUser } from '~/test/seeds';
import { getTestDb, truncateTables } from '~/test/test-db';

describe('Family Trees — Public (E2E)', () => {
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

  describe('GET /api/family-trees/public', () => {
    it('returns 200 without auth', async () => {
      const res = await req.get('/api/family-trees/public').expect(200);

      expect(res.body.familyTrees).toHaveLength(0);
    });

    it('returns only public trees', async () => {
      const user = await seedUser(getTestDb());
      const publicTree = await seedFamilyTree(getTestDb(), user.id, {
        isPublic: true,
      });

      await seedFamilyTree(getTestDb(), user.id, { isPublic: false });

      const res = await req.get('/api/family-trees/public').expect(200);

      expect(res.body.familyTrees).toHaveLength(1);
      expect(res.body.familyTrees[0].id).toBe(publicTree.id);
      expect(res.body.familyTrees[0].isPublic).toBe(true);
    });
  });

  describe('GET /api/family-trees/public/:id', () => {
    it('returns the tree when it is public', async () => {
      const user = await seedUser(getTestDb());
      const tree = await seedFamilyTree(getTestDb(), user.id, {
        isPublic: true,
      });

      const res = await req
        .get(`/api/family-trees/public/${tree.id}`)
        .expect(200);

      expect(res.body.id).toBe(tree.id);
    });

    it('returns 404 for a private tree', async () => {
      const user = await seedUser(getTestDb());
      const tree = await seedFamilyTree(getTestDb(), user.id, {
        isPublic: false,
      });

      await req.get(`/api/family-trees/public/${tree.id}`).expect(404);
    });

    it('returns 404 for a non-existent tree', async () => {
      await req
        .get('/api/family-trees/public/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });
  });
});
