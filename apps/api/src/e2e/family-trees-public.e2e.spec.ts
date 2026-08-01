/// <reference types="jest" />
import type { INestApplication } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import { eq } from 'drizzle-orm';
import type supertest from 'supertest';
import * as schema from '~/database/schema';
import { createE2EApp, signToken } from '~/test/create-e2e-app';
import { seedFamilyTree, seedUser } from '~/test/seeds';
import { getTestDb, truncateTables } from '~/test/test-db';

// The visit increment is fire-and-forget, so it may land after the response.
// Poll instead of sleeping a fixed duration, which flakes on a loaded runner.
// Every test that triggers an increment must drain it before returning, or the
// write can still be in flight when the pool closes in afterAll.
async function waitForVisitCount(
  familyTreeId: string,
  expected: number,
): Promise<void> {
  for (let attempt = 0; attempt < 50; attempt++) {
    const [row] = await getTestDb()
      .select()
      .from(schema.familyTreesSchema)
      .where(eq(schema.familyTreesSchema.id, familyTreeId));

    if (row?.visitCount === expected) return;

    await new Promise((resolve) => setTimeout(resolve, 20));
  }

  throw new Error(`visit count for ${familyTreeId} never reached ${expected}`);
}

describe('Family Trees — Public (E2E)', () => {
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

    it('does not leak the visit count in the response body', async () => {
      const user = await seedUser(getTestDb());
      const tree = await seedFamilyTree(getTestDb(), user.id, {
        isPublic: true,
      });

      const res = await req
        .get(`/api/family-trees/public/${tree.id}`)
        .expect(200);

      expect(res.body.visitCount).toBeUndefined();

      await waitForVisitCount(tree.id, 1);
    });

    it('bumps the tree above a less-visited one in the public list', async () => {
      const user = await seedUser(getTestDb());
      const popularTree = await seedFamilyTree(getTestDb(), user.id, {
        isPublic: true,
      });
      const quietTree = await seedFamilyTree(getTestDb(), user.id, {
        isPublic: true,
      });

      await req.get(`/api/family-trees/public/${popularTree.id}`).expect(200);
      await req.get(`/api/family-trees/public/${popularTree.id}`).expect(200);
      await waitForVisitCount(popularTree.id, 2);

      const res = await req.get('/api/family-trees/public').expect(200);
      const ids = res.body.familyTrees.map((tree: { id: string }) => tree.id);

      expect(ids.indexOf(popularTree.id)).toBeLessThan(
        ids.indexOf(quietTree.id),
      );
    });

    it('does not count the owner viewing their own tree as a public visit', async () => {
      const user = await seedUser(getTestDb());
      const tree = await seedFamilyTree(getTestDb(), user.id, {
        isPublic: true,
      });
      const token = await signToken(jwtService, user);

      await req
        .get(`/api/family-trees/${tree.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const [row] = await getTestDb()
        .select()
        .from(schema.familyTreesSchema)
        .where(eq(schema.familyTreesSchema.id, tree.id));

      expect(row.visitCount).toBe(0);
    });
  });
});
