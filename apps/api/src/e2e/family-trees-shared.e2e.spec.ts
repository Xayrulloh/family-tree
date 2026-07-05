/// <reference types="jest" />
import type { INestApplication } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import { eq } from 'drizzle-orm';
import type supertest from 'supertest';
import * as schema from '~/database/schema';
import { createE2EApp, signToken } from '~/test/create-e2e-app';
import { seedFamilyTree, seedUser } from '~/test/seeds';
import { getTestDb, truncateTables } from '~/test/test-db';

describe('Shared Family Trees (E2E)', () => {
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

  async function seedShare(
    overrides: Partial<typeof schema.sharedFamilyTreesSchema.$inferInsert> = {},
  ) {
    const db = getTestDb();
    const owner = await seedUser(db);
    const sharedUser = await seedUser(db);
    const tree = await seedFamilyTree(db, owner.id);

    await db.insert(schema.sharedFamilyTreesSchema).values({
      familyTreeId: tree.id,
      userId: sharedUser.id,
      canAddMembers: true,
      ...overrides,
    });

    return { owner, sharedUser, tree };
  }

  describe('GET /api/family-trees/shared', () => {
    it('returns 401 without a token', async () => {
      await req.get('/api/family-trees/shared').expect(401);
    });

    it('returns an empty list for a user with no shares', async () => {
      const user = await seedUser(getTestDb());
      const token = await signToken(jwtService, user);

      const res = await req
        .get('/api/family-trees/shared')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.sharedFamilyTrees).toHaveLength(0);
    });

    it('lists trees shared with the authenticated user', async () => {
      const { sharedUser, tree } = await seedShare();

      const token = await signToken(jwtService, sharedUser);

      const res = await req
        .get('/api/family-trees/shared')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.sharedFamilyTrees).toHaveLength(1);
      expect(res.body.sharedFamilyTrees[0].familyTreeId).toBe(tree.id);
      expect(res.body.sharedFamilyTrees[0].canAddMembers).toBe(true);
    });
  });

  describe('GET /api/family-trees/shared/:familyTreeId', () => {
    it('returns the RBAC flags for a shared tree', async () => {
      const { sharedUser, tree } = await seedShare();
      const token = await signToken(jwtService, sharedUser);

      const res = await req
        .get(`/api/family-trees/shared/${tree.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.familyTreeId).toBe(tree.id);
      expect(res.body.canAddMembers).toBe(true);
      expect(res.body.canEditMembers).toBe(false);
    });

    it('returns 403 for a user who has no share for the tree', async () => {
      const { tree } = await seedShare();
      const stranger = await seedUser(getTestDb());

      const token = await signToken(jwtService, stranger);

      await req
        .get(`/api/family-trees/shared/${tree.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('returns 403 for a blocked shared user', async () => {
      const { sharedUser: blockedUser, tree } = await seedShare({
        isBlocked: true,
      });

      const token = await signToken(jwtService, blockedUser);

      await req
        .get(`/api/family-trees/shared/${tree.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });
  });

  describe('GET /api/family-trees/shared/:familyTreeId/users', () => {
    it('lets the owner list users who have access to the tree', async () => {
      const { owner, sharedUser, tree } = await seedShare();
      const token = await signToken(jwtService, owner);

      const res = await req
        .get(`/api/family-trees/shared/${tree.id}/users`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.sharedFamilyTreeUsers).toHaveLength(1);
      expect(res.body.sharedFamilyTreeUsers[0].userId).toBe(sharedUser.id);
    });

    it('returns 403 when a non-owner requests the user list', async () => {
      const { sharedUser, tree } = await seedShare();

      const token = await signToken(jwtService, sharedUser);

      await req
        .get(`/api/family-trees/shared/${tree.id}/users`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });
  });

  describe('PUT /api/family-trees/shared/:familyTreeId/users/:userId', () => {
    const rbacUpdate = {
      canAddMembers: false,
      canEditMembers: true,
      canDeleteMembers: false,
      isBlocked: false,
    };

    it('lets the owner update RBAC flags for a shared user', async () => {
      const { owner, sharedUser, tree } = await seedShare();
      const token = await signToken(jwtService, owner);

      await req
        .put(`/api/family-trees/shared/${tree.id}/users/${sharedUser.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(rbacUpdate)
        .expect(204);

      const [share] = await getTestDb()
        .select()
        .from(schema.sharedFamilyTreesSchema)
        .where(eq(schema.sharedFamilyTreesSchema.familyTreeId, tree.id));
      expect(share.canEditMembers).toBe(true);
      expect(share.canAddMembers).toBe(false);
    });

    it('returns 403 when a non-owner tries to update RBAC flags', async () => {
      const { sharedUser, tree } = await seedShare();
      const token = await signToken(jwtService, sharedUser);

      await req
        .put(`/api/family-trees/shared/${tree.id}/users/${sharedUser.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(rbacUpdate)
        .expect(403);
    });
  });
});
