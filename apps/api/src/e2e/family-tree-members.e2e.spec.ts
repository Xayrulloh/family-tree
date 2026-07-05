/// <reference types="jest" />

import { UserGenderEnum } from '@family-tree/shared';
import type { INestApplication } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import type supertest from 'supertest';
import { createE2EApp, signToken } from '~/test/create-e2e-app';
import { seedFamilyTree, seedMember, seedUser } from '~/test/seeds';
import { getTestDb, truncateTables } from '~/test/test-db';

describe('Family Tree Members (E2E)', () => {
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

  describe('GET /api/family-trees/:familyTreeId/members', () => {
    it('returns 401 without a token', async () => {
      await req
        .get('/api/family-trees/00000000-0000-0000-0000-000000000000/members')
        .expect(401);
    });

    it('returns 403 for a tree belonging to another user', async () => {
      const owner = await seedUser(getTestDb());
      const tree = await seedFamilyTree(getTestDb(), owner.id);
      const other = await seedUser(getTestDb());
      const token = await signToken(jwtService, other);

      await req
        .get(`/api/family-trees/${tree.id}/members`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('returns an empty list for a tree with no members', async () => {
      const user = await seedUser(getTestDb());
      const tree = await seedFamilyTree(getTestDb(), user.id);
      const token = await signToken(jwtService, user);

      const res = await req
        .get(`/api/family-trees/${tree.id}/members`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toHaveLength(0);
    });

    it('returns seeded members', async () => {
      const user = await seedUser(getTestDb());
      const tree = await seedFamilyTree(getTestDb(), user.id);

      await seedMember(getTestDb(), tree.id, { name: 'Alice' });

      const token = await signToken(jwtService, user);

      const res = await req
        .get(`/api/family-trees/${tree.id}/members`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toHaveLength(1);
      expect(res.body[0].name).toBe('Alice');
    });
  });

  describe('GET /api/family-trees/:familyTreeId/members/:id', () => {
    it('returns the member by id', async () => {
      const user = await seedUser(getTestDb());
      const tree = await seedFamilyTree(getTestDb(), user.id);
      const member = await seedMember(getTestDb(), tree.id, { name: 'Bob' });
      const token = await signToken(jwtService, user);

      const res = await req
        .get(`/api/family-trees/${tree.id}/members/${member.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.id).toBe(member.id);
      expect(res.body.name).toBe('Bob');
    });
  });

  describe('POST /api/family-trees/:familyTreeId/members/spouse', () => {
    it('returns 401 without a token', async () => {
      await req
        .post(
          '/api/family-trees/00000000-0000-0000-0000-000000000000/members/spouse',
        )
        .send({ fromMemberId: '00000000-0000-0000-0000-000000000001' })
        .expect(401);
    });

    it('creates a spouse and returns 201', async () => {
      const user = await seedUser(getTestDb());
      const tree = await seedFamilyTree(getTestDb(), user.id);
      const member = await seedMember(getTestDb(), tree.id, {
        gender: UserGenderEnum.MALE,
      });
      const token = await signToken(jwtService, user);

      const res = await req
        .post(`/api/family-trees/${tree.id}/members/spouse`)
        .set('Authorization', `Bearer ${token}`)
        .send({ fromMemberId: member.id })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.gender).toBe(UserGenderEnum.FEMALE);
    });
  });

  describe('PUT /api/family-trees/:familyTreeId/members/:id', () => {
    it('returns 401 without a token', async () => {
      await req
        .put(
          '/api/family-trees/00000000-0000-0000-0000-000000000000/members/00000000-0000-0000-0000-000000000001',
        )
        .send({ name: 'New Name' })
        .expect(401);
    });

    it('returns 204 on a successful update', async () => {
      const user = await seedUser(getTestDb());
      const tree = await seedFamilyTree(getTestDb(), user.id);
      const member = await seedMember(getTestDb(), tree.id);
      const token = await signToken(jwtService, user);

      await req
        .put(`/api/family-trees/${tree.id}/members/${member.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated Name' })
        .expect(204);
    });
  });

  describe('DELETE /api/family-trees/:familyTreeId/members/:id', () => {
    it('returns 401 without a token', async () => {
      await req
        .delete(
          '/api/family-trees/00000000-0000-0000-0000-000000000000/members/00000000-0000-0000-0000-000000000001',
        )
        .expect(401);
    });

    it('returns 204 on a successful delete', async () => {
      const user = await seedUser(getTestDb());
      const tree = await seedFamilyTree(getTestDb(), user.id);
      const toDelete = await seedMember(getTestDb(), tree.id);

      // Tree must have at least one surviving member after deletion.
      await seedMember(getTestDb(), tree.id);

      const token = await signToken(jwtService, user);

      await req
        .delete(`/api/family-trees/${tree.id}/members/${toDelete.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(204);
    });
  });
});
