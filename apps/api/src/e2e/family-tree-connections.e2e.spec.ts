/// <reference types="jest" />
import { FamilyTreeMemberConnectionEnum } from '@family-tree/shared';
import type { INestApplication } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import type supertest from 'supertest';
import * as schema from '~/database/schema';
import { createE2EApp, signToken } from '~/test/create-e2e-app';
import { seedFamilyTree, seedMember, seedUser } from '~/test/seeds';
import { getTestDb, truncateTables } from '~/test/test-db';

describe('Family Tree Member Connections (E2E)', () => {
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

  async function seedTreeWithConnection() {
    const db = getTestDb();

    const owner = await seedUser(db);
    const tree = await seedFamilyTree(db, owner.id);
    const memberA = await seedMember(db, tree.id);
    const memberB = await seedMember(db, tree.id, { name: 'Second Member' });

    const [connection] = await db
      .insert(schema.familyTreeMemberConnectionsSchema)
      .values({
        familyTreeId: tree.id,
        fromMemberId: memberA.id,
        toMemberId: memberB.id,
        type: FamilyTreeMemberConnectionEnum.SPOUSE,
      })
      .returning();

    return { owner, tree, memberA, memberB, connection };
  }

  describe('GET /api/family-trees/:familyTreeId/members/connections', () => {
    it('returns 401 without a token', async () => {
      const { tree } = await seedTreeWithConnection();

      await req
        .get(`/api/family-trees/${tree.id}/members/connections`)
        .expect(401);
    });

    it('returns the connections of an owned tree', async () => {
      const { owner, tree, connection } = await seedTreeWithConnection();

      const token = await signToken(jwtService, owner);

      const res = await req
        .get(`/api/family-trees/${tree.id}/members/connections`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toHaveLength(1);
      expect(res.body[0].id).toBe(connection.id);
      expect(res.body[0].type).toBe(FamilyTreeMemberConnectionEnum.SPOUSE);
    });

    it('returns 403 for a user who does not own the tree', async () => {
      const { tree } = await seedTreeWithConnection();
      const stranger = await seedUser(getTestDb());
      const token = await signToken(jwtService, stranger);

      await req
        .get(`/api/family-trees/${tree.id}/members/connections`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });
  });

  describe('GET /api/family-trees/:familyTreeId/members/:memberUserId/connections', () => {
    it('returns only the connections of the given member', async () => {
      const { owner, tree, memberA, connection } =
        await seedTreeWithConnection();

      const token = await signToken(jwtService, owner);

      const res = await req
        .get(`/api/family-trees/${tree.id}/members/${memberA.id}/connections`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toHaveLength(1);
      expect(res.body[0].id).toBe(connection.id);
    });
  });
});
