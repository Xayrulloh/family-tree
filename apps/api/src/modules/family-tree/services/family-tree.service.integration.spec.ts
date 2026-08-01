/// <reference types="jest" />
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import * as schema from '~/database/schema';
import { seedFamilyTree, seedMember, seedUser } from '~/test/seeds';
import { getTestDb, truncateTables } from '~/test/test-db';
import { FamilyTreeService } from './family-tree.service';

const mockCloudflareConfig = {
  deleteFile: jest.fn(),
  uploadFile: jest.fn(),
};

describe('FamilyTreeService (integration)', () => {
  let service: FamilyTreeService;

  beforeAll(() => {
    service = new FamilyTreeService(getTestDb(), mockCloudflareConfig as any);
  });

  beforeEach(async () => {
    jest.resetAllMocks();
    await truncateTables();
  });

  describe('createFamilyTree', () => {
    it('creates and returns the tree', async () => {
      const user = await seedUser(getTestDb());

      const result = await service.createFamilyTree(user.id, {
        name: 'Smith Family',
        image: null,
        isPublic: false,
      });

      expect(result.name).toBe('Smith Family');
      expect(result.createdBy).toBe(user.id);
    });

    it('throws BadRequestException when the same user creates a duplicate name', async () => {
      const user = await seedUser(getTestDb());

      await seedFamilyTree(getTestDb(), user.id, { name: 'Smith Family' });

      await expect(
        service.createFamilyTree(user.id, {
          name: 'Smith Family',
          image: null,
          isPublic: false,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('allows different users to create trees with the same name', async () => {
      const [user1, user2] = await Promise.all([
        seedUser(getTestDb()),
        seedUser(getTestDb()),
      ]);

      await seedFamilyTree(getTestDb(), user1.id, { name: 'Smith Family' });

      await expect(
        service.createFamilyTree(user2.id, {
          name: 'Smith Family',
          image: null,
          isPublic: false,
        }),
      ).resolves.toBeDefined();
    });
  });

  describe('getFamilyTreeById', () => {
    it('returns the tree when the id exists', async () => {
      const user = await seedUser(getTestDb());
      const tree = await seedFamilyTree(getTestDb(), user.id);

      const result = await service.getFamilyTreeById(tree.id);

      expect(result.id).toBe(tree.id);
    });

    it('throws NotFoundException for an unknown id', async () => {
      await expect(
        service.getFamilyTreeById('550e8400-e29b-41d4-a716-446655440000'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateFamilyTree', () => {
    it('persists the updated fields', async () => {
      const user = await seedUser(getTestDb());
      const tree = await seedFamilyTree(getTestDb(), user.id, {
        name: 'Before',
      });

      await service.updateFamilyTree(tree.id, {
        name: 'After',
        isPublic: true,
      });

      const updated = await service.getFamilyTreeById(tree.id);

      expect(updated.name).toBe('After');
      expect(updated.isPublic).toBe(true);
    });

    it('throws NotFoundException for an unknown id', async () => {
      await expect(
        service.updateFamilyTree('550e8400-e29b-41d4-a716-446655440000', {
          name: 'Ghost',
          isPublic: false,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('calls deleteFile when the image changes', async () => {
      const user = await seedUser(getTestDb());
      const tree = await seedFamilyTree(getTestDb(), user.id, {
        image: 'https://r2.example.com/old.png',
      });

      await service.updateFamilyTree(tree.id, {
        name: tree.name,
        image: 'https://r2.example.com/new.png',
        isPublic: false,
      });

      expect(mockCloudflareConfig.deleteFile).toHaveBeenCalledWith(
        'https://r2.example.com/old.png',
      );
    });

    it('does not call deleteFile when the image is unchanged', async () => {
      const user = await seedUser(getTestDb());
      const tree = await seedFamilyTree(getTestDb(), user.id, {
        image: 'https://r2.example.com/same.png',
      });

      await service.updateFamilyTree(tree.id, {
        name: tree.name,
        image: 'https://r2.example.com/same.png',
        isPublic: false,
      });

      expect(mockCloudflareConfig.deleteFile).not.toHaveBeenCalled();
    });
  });

  describe('deleteFamilyTree', () => {
    it('removes the tree from the database', async () => {
      const user = await seedUser(getTestDb());
      const tree = await seedFamilyTree(getTestDb(), user.id);

      await service.deleteFamilyTree(tree.id);

      await expect(service.getFamilyTreeById(tree.id)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws NotFoundException for an unknown id', async () => {
      await expect(
        service.deleteFamilyTree('550e8400-e29b-41d4-a716-446655440000'),
      ).rejects.toThrow(NotFoundException);
    });

    it('calls deleteFile for the tree image', async () => {
      const user = await seedUser(getTestDb());
      const tree = await seedFamilyTree(getTestDb(), user.id, {
        image: 'https://r2.example.com/cover.png',
      });

      await service.deleteFamilyTree(tree.id);

      expect(mockCloudflareConfig.deleteFile).toHaveBeenCalledWith(
        'https://r2.example.com/cover.png',
      );
    });

    it('calls deleteFile for members with custom (non-DiceBear) images', async () => {
      const user = await seedUser(getTestDb());
      const tree = await seedFamilyTree(getTestDb(), user.id);

      await seedMember(getTestDb(), tree.id, {
        image: 'https://r2.example.com/member.png',
      });

      await service.deleteFamilyTree(tree.id);

      expect(mockCloudflareConfig.deleteFile).toHaveBeenCalledWith(
        'https://r2.example.com/member.png',
      );
    });

    it('does not call deleteFile for members with DiceBear images', async () => {
      const user = await seedUser(getTestDb());
      const tree = await seedFamilyTree(getTestDb(), user.id);

      await seedMember(getTestDb(), tree.id, {
        image: 'https://api.dicebear.com/9.x/notionists/svg?seed=abc',
      });

      await service.deleteFamilyTree(tree.id);

      expect(mockCloudflareConfig.deleteFile).not.toHaveBeenCalled();
    });
  });

  describe('getFamilyTreesOfUser', () => {
    it('returns only trees belonging to the user', async () => {
      const [user1, user2] = await Promise.all([
        seedUser(getTestDb()),
        seedUser(getTestDb()),
      ]);

      await seedFamilyTree(getTestDb(), user1.id);
      await seedFamilyTree(getTestDb(), user2.id);

      const result = await service.getFamilyTreesOfUser(user1.id, {
        page: 1,
        perPage: 10,
      });

      expect(result.totalCount).toBe(1);
      expect(result.familyTrees[0].createdBy).toBe(user1.id);
    });

    it('filters by name case-insensitively', async () => {
      const user = await seedUser(getTestDb());

      await seedFamilyTree(getTestDb(), user.id, { name: 'Smith Family' });
      await seedFamilyTree(getTestDb(), user.id, { name: 'Jones Family' });

      const result = await service.getFamilyTreesOfUser(user.id, {
        page: 1,
        perPage: 10,
        name: 'smith',
      });

      expect(result.totalCount).toBe(1);
      expect(result.familyTrees[0].name).toBe('Smith Family');
    });

    it('paginates correctly', async () => {
      const user = await seedUser(getTestDb());

      await Promise.all([
        seedFamilyTree(getTestDb(), user.id),
        seedFamilyTree(getTestDb(), user.id),
        seedFamilyTree(getTestDb(), user.id),
      ]);

      const page1 = await service.getFamilyTreesOfUser(user.id, {
        page: 1,
        perPage: 2,
      });

      const page2 = await service.getFamilyTreesOfUser(user.id, {
        page: 2,
        perPage: 2,
      });

      expect(page1.familyTrees).toHaveLength(2);
      expect(page1.totalCount).toBe(3);
      expect(page2.familyTrees).toHaveLength(1);
    });

    it('keeps ordering by createdAt, unaffected by visit counts', async () => {
      const user = await seedUser(getTestDb());

      const olderTree = await seedFamilyTree(getTestDb(), user.id);
      // Give the newer tree more visits than the older one — the owner
      // listing must not be swayed by this, unlike the public listing.
      const newerTree = await seedFamilyTree(getTestDb(), user.id, {
        visitCount: 100,
      });

      const result = await service.getFamilyTreesOfUser(user.id, {
        page: 1,
        perPage: 10,
      });

      expect(result.familyTrees.map((tree) => tree.id)).toEqual([
        olderTree.id,
        newerTree.id,
      ]);
    });
  });

  describe('getPublicFamilyTrees', () => {
    it('returns only public trees', async () => {
      const user = await seedUser(getTestDb());

      await seedFamilyTree(getTestDb(), user.id, { isPublic: true });
      await seedFamilyTree(getTestDb(), user.id, { isPublic: false });

      const result = await service.getPublicFamilyTrees({
        page: 1,
        perPage: 10,
      });

      expect(result.totalCount).toBe(1);
      expect(result.familyTrees[0].isPublic).toBe(true);
    });

    it('orders trees by visit count descending', async () => {
      const user = await seedUser(getTestDb());

      const lessVisited = await seedFamilyTree(getTestDb(), user.id, {
        isPublic: true,
        visitCount: 1,
      });
      const mostVisited = await seedFamilyTree(getTestDb(), user.id, {
        isPublic: true,
        visitCount: 5,
      });

      const result = await service.getPublicFamilyTrees({
        page: 1,
        perPage: 10,
      });

      expect(result.familyTrees.map((tree) => tree.id)).toEqual([
        mostVisited.id,
        lessVisited.id,
      ]);
    });

    it('ranks trees with no visits last, without excluding them', async () => {
      const user = await seedUser(getTestDb());

      const unvisited = await seedFamilyTree(getTestDb(), user.id, {
        isPublic: true,
      });
      const visited = await seedFamilyTree(getTestDb(), user.id, {
        isPublic: true,
        visitCount: 1,
      });

      const result = await service.getPublicFamilyTrees({
        page: 1,
        perPage: 10,
      });

      expect(result.totalCount).toBe(2);
      expect(result.familyTrees.map((tree) => tree.id)).toEqual([
        visited.id,
        unvisited.id,
      ]);
    });

    it('paginates correctly while preserving visit-count order', async () => {
      const user = await seedUser(getTestDb());

      const first = await seedFamilyTree(getTestDb(), user.id, {
        isPublic: true,
        visitCount: 30,
      });
      const second = await seedFamilyTree(getTestDb(), user.id, {
        isPublic: true,
        visitCount: 20,
      });
      const third = await seedFamilyTree(getTestDb(), user.id, {
        isPublic: true,
        visitCount: 10,
      });

      const page1 = await service.getPublicFamilyTrees({
        page: 1,
        perPage: 2,
      });
      const page2 = await service.getPublicFamilyTrees({
        page: 2,
        perPage: 2,
      });

      expect(page1.totalCount).toBe(3);
      expect(page1.familyTrees.map((tree) => tree.id)).toEqual([
        first.id,
        second.id,
      ]);
      expect(page2.familyTrees.map((tree) => tree.id)).toEqual([third.id]);
    });

    it('breaks ties on equal visit counts with the newest tree first', async () => {
      const user = await seedUser(getTestDb());

      const olderTree = await seedFamilyTree(getTestDb(), user.id, {
        isPublic: true,
        visitCount: 7,
      });
      const newerTree = await seedFamilyTree(getTestDb(), user.id, {
        isPublic: true,
        visitCount: 7,
      });

      const result = await service.getPublicFamilyTrees({
        page: 1,
        perPage: 10,
      });

      expect(result.familyTrees.map((tree) => tree.id)).toEqual([
        newerTree.id,
        olderTree.id,
      ]);
    });

    it('surfaces a brand new tree above older ones that also have no visits', async () => {
      const user = await seedUser(getTestDb());

      const olderTree = await seedFamilyTree(getTestDb(), user.id, {
        isPublic: true,
      });
      const newestTree = await seedFamilyTree(getTestDb(), user.id, {
        isPublic: true,
      });

      const result = await service.getPublicFamilyTrees({
        page: 1,
        perPage: 10,
      });

      expect(result.familyTrees.map((tree) => tree.id)).toEqual([
        newestTree.id,
        olderTree.id,
      ]);
    });

    it('pages disjointly when trees tie on both visit count and createdAt', async () => {
      const user = await seedUser(getTestDb());
      // `defaultNow()` is the transaction timestamp, so rows written in one
      // statement share a createdAt. Without the id tiebreaker the sort is not
      // total and LIMIT/OFFSET can repeat or drop a tree across pages.
      const createdAt = new Date().toISOString();

      await getTestDb()
        .insert(schema.familyTreesSchema)
        .values(
          ['Tie A', 'Tie B', 'Tie C', 'Tie D'].map((name) => ({
            name,
            createdBy: user.id,
            isPublic: true,
            visitCount: 4,
            createdAt,
          })),
        );

      const [page1, page2] = await Promise.all([
        service.getPublicFamilyTrees({ page: 1, perPage: 2 }),
        service.getPublicFamilyTrees({ page: 2, perPage: 2 }),
      ]);

      const page1Ids = page1.familyTrees.map((tree) => tree.id);
      const page2Ids = page2.familyTrees.map((tree) => tree.id);

      expect(new Set([...page1Ids, ...page2Ids]).size).toBe(4);
      expect(page1Ids.filter((id) => page2Ids.includes(id))).toEqual([]);
    });
  });

  describe('incrementPublicFamilyTreeVisitCount', () => {
    it('increments the count on each call', async () => {
      const user = await seedUser(getTestDb());
      const tree = await seedFamilyTree(getTestDb(), user.id, {
        isPublic: true,
      });

      await service.incrementPublicFamilyTreeVisitCount(tree.id);
      await service.incrementPublicFamilyTreeVisitCount(tree.id);
      await service.incrementPublicFamilyTreeVisitCount(tree.id);

      // Read the row directly: `visitCount` is deliberately absent from
      // FamilyTreeResponseDto so it can never reach an API response.
      const [updated] = await getTestDb()
        .select()
        .from(schema.familyTreesSchema)
        .where(eq(schema.familyTreesSchema.id, tree.id));

      expect(updated.visitCount).toBe(3);
    });

    it('does not bump updatedAt when counting a visit', async () => {
      const user = await seedUser(getTestDb());
      const tree = await seedFamilyTree(getTestDb(), user.id, {
        isPublic: true,
      });

      await service.incrementPublicFamilyTreeVisitCount(tree.id);

      const [updated] = await getTestDb()
        .select()
        .from(schema.familyTreesSchema)
        .where(eq(schema.familyTreesSchema.id, tree.id));

      // Viewing a tree is not modifying it — anything relying on updatedAt
      // (caches, sync clients) must not see a visit as an edit.
      expect(updated.visitCount).toBe(1);
      expect(updated.updatedAt).toBe(tree.updatedAt);
    });

    it('leaves other trees untouched', async () => {
      const user = await seedUser(getTestDb());
      const [visited, untouched] = await Promise.all([
        seedFamilyTree(getTestDb(), user.id, { isPublic: true }),
        seedFamilyTree(getTestDb(), user.id, { isPublic: true }),
      ]);

      await service.incrementPublicFamilyTreeVisitCount(visited.id);

      const [other] = await getTestDb()
        .select()
        .from(schema.familyTreesSchema)
        .where(eq(schema.familyTreesSchema.id, untouched.id));

      expect(other.visitCount).toBe(0);
    });
  });
});
