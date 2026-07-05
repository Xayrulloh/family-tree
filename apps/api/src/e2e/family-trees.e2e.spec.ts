/// <reference types="jest" />
import type { INestApplication } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import type supertest from 'supertest';
import { createE2EApp, signToken } from '~/test/create-e2e-app';
import { seedFamilyTree, seedUser } from '~/test/seeds';
import { getTestDb, truncateTables } from '~/test/test-db';

describe('Family Trees (E2E)', () => {
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

  describe('GET /api/family-trees', () => {
    it('returns 401 without a token', async () => {
      await req.get('/api/family-trees').expect(401);
    });

    it('returns a paginated empty list for a new user', async () => {
      const user = await seedUser(getTestDb());
      const token = await signToken(jwtService, user);

      const res = await req
        .get('/api/family-trees')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.familyTrees).toHaveLength(0);
      expect(res.body.totalCount).toBe(0);
    });
  });

  describe('POST /api/family-trees', () => {
    it('returns 401 without a token', async () => {
      await req
        .post('/api/family-trees')
        .send({ name: 'Smith Family', isPublic: false })
        .expect(401);
    });

    it('creates a tree and returns 201 with the new tree', async () => {
      const user = await seedUser(getTestDb());
      const token = await signToken(jwtService, user);

      const res = await req
        .post('/api/family-trees')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Smith Family', isPublic: false, image: null })
        .expect(201);

      expect(res.body.name).toBe('Smith Family');
      expect(res.body.createdBy).toBe(user.id);
    });
  });

  describe('GET /api/family-trees/:id', () => {
    it('returns 401 without a token', async () => {
      await req
        .get('/api/family-trees/00000000-0000-0000-0000-000000000000')
        .expect(401);
    });

    it('returns the tree for its owner', async () => {
      const user = await seedUser(getTestDb());
      const tree = await seedFamilyTree(getTestDb(), user.id);
      const token = await signToken(jwtService, user);

      const res = await req
        .get(`/api/family-trees/${tree.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.id).toBe(tree.id);
    });

    it('returns 403 for a tree belonging to another user', async () => {
      const owner = await seedUser(getTestDb());
      const tree = await seedFamilyTree(getTestDb(), owner.id);
      const other = await seedUser(getTestDb());
      const token = await signToken(jwtService, other);

      await req
        .get(`/api/family-trees/${tree.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });
  });

  describe('PUT /api/family-trees/:id', () => {
    it('returns 401 without a token', async () => {
      await req
        .put('/api/family-trees/00000000-0000-0000-0000-000000000000')
        .send({ name: 'Updated' })
        .expect(401);
    });

    it('returns 403 when a non-owner attempts the update', async () => {
      const owner = await seedUser(getTestDb());
      const tree = await seedFamilyTree(getTestDb(), owner.id);
      const other = await seedUser(getTestDb());
      const token = await signToken(jwtService, other);

      await req
        .put(`/api/family-trees/${tree.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Hijacked' })
        .expect(403);
    });

    it('returns 204 on a successful update', async () => {
      const user = await seedUser(getTestDb());
      const tree = await seedFamilyTree(getTestDb(), user.id);
      const token = await signToken(jwtService, user);

      await req
        .put(`/api/family-trees/${tree.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated Name' })
        .expect(204);
    });
  });

  describe('DELETE /api/family-trees/:id', () => {
    it('returns 401 without a token', async () => {
      await req
        .delete('/api/family-trees/00000000-0000-0000-0000-000000000000')
        .expect(401);
    });

    it('returns 403 when a non-owner attempts the delete', async () => {
      const owner = await seedUser(getTestDb());
      const tree = await seedFamilyTree(getTestDb(), owner.id);
      const other = await seedUser(getTestDb());
      const token = await signToken(jwtService, other);

      await req
        .delete(`/api/family-trees/${tree.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('returns 204 on a successful delete', async () => {
      const user = await seedUser(getTestDb());
      const tree = await seedFamilyTree(getTestDb(), user.id);
      const token = await signToken(jwtService, user);

      await req
        .delete(`/api/family-trees/${tree.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(204);
    });
  });
});
