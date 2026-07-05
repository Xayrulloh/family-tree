/// <reference types="jest" />
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import * as schema from '~/database/schema';
import { seedFamilyTree, seedUser } from '~/test/seeds';
import { getTestDb, truncateTables } from '~/test/test-db';
import { FamilyTreeSharedService } from './shared-family-tree.service';

async function share(
  familyTreeId: string,
  userId: string,
  overrides: Partial<typeof schema.sharedFamilyTreesSchema.$inferInsert> = {},
) {
  await getTestDb()
    .insert(schema.sharedFamilyTreesSchema)
    .values({ familyTreeId, userId, ...overrides });
}

describe('FamilyTreeSharedService (integration)', () => {
  let service: FamilyTreeSharedService;

  beforeAll(() => {
    service = new FamilyTreeSharedService(getTestDb());
  });

  beforeEach(async () => {
    await truncateTables();
  });

  describe('getSharedFamilyTrees', () => {
    it('returns trees shared with the user', async () => {
      const [owner, viewer] = await Promise.all([
        seedUser(getTestDb()),
        seedUser(getTestDb()),
      ]);

      const tree = await seedFamilyTree(getTestDb(), owner.id);

      await share(tree.id, viewer.id);

      const result = await service.getSharedFamilyTrees(viewer.id, {
        page: 1,
        perPage: 10,
      });

      expect(result.totalCount).toBe(1);
      expect(result.sharedFamilyTrees[0].familyTreeId).toBe(tree.id);
    });

    it('excludes blocked shares', async () => {
      const [owner, viewer] = await Promise.all([
        seedUser(getTestDb()),
        seedUser(getTestDb()),
      ]);

      const tree = await seedFamilyTree(getTestDb(), owner.id);

      await share(tree.id, viewer.id, { isBlocked: true });

      const result = await service.getSharedFamilyTrees(viewer.id, {
        page: 1,
        perPage: 10,
      });

      expect(result.totalCount).toBe(0);
    });

    it('filters by tree name case-insensitively', async () => {
      const [owner, viewer] = await Promise.all([
        seedUser(getTestDb()),
        seedUser(getTestDb()),
      ]);

      const smith = await seedFamilyTree(getTestDb(), owner.id, {
        name: 'Smith Family',
      });

      const jones = await seedFamilyTree(getTestDb(), owner.id, {
        name: 'Jones Family',
      });

      await share(smith.id, viewer.id);
      await share(jones.id, viewer.id);

      const result = await service.getSharedFamilyTrees(viewer.id, {
        page: 1,
        perPage: 10,
        name: 'smith',
      });

      expect(result.totalCount).toBe(1);
      expect(result.sharedFamilyTrees[0].name).toBe('Smith Family');
    });
  });

  describe('getSharedFamilyTreeById', () => {
    it('returns the shared tree with permission flags', async () => {
      const [owner, viewer] = await Promise.all([
        seedUser(getTestDb()),
        seedUser(getTestDb()),
      ]);

      const tree = await seedFamilyTree(getTestDb(), owner.id);

      await share(tree.id, viewer.id, { canEditMembers: true });

      const result = await service.getSharedFamilyTreeById(viewer.id, tree.id);

      expect(result.familyTreeId).toBe(tree.id);
      expect(result.canEditMembers).toBe(true);
    });

    it('throws ForbiddenException when not shared with the user', async () => {
      const [owner, stranger] = await Promise.all([
        seedUser(getTestDb()),
        seedUser(getTestDb()),
      ]);

      const tree = await seedFamilyTree(getTestDb(), owner.id);

      await expect(
        service.getSharedFamilyTreeById(stranger.id, tree.id),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when the share is blocked', async () => {
      const [owner, viewer] = await Promise.all([
        seedUser(getTestDb()),
        seedUser(getTestDb()),
      ]);

      const tree = await seedFamilyTree(getTestDb(), owner.id);

      await share(tree.id, viewer.id, { isBlocked: true });

      await expect(
        service.getSharedFamilyTreeById(viewer.id, tree.id),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('createSharedFamilyTree', () => {
    it('inserts a share row', async () => {
      const [owner, viewer] = await Promise.all([
        seedUser(getTestDb()),
        seedUser(getTestDb()),
      ]);

      const tree = await seedFamilyTree(getTestDb(), owner.id);

      await service.createSharedFamilyTree({
        familyTreeId: tree.id,
        userId: viewer.id,
      });

      const row = await getTestDb().query.sharedFamilyTreesSchema.findFirst({
        where: and(
          eq(schema.sharedFamilyTreesSchema.familyTreeId, tree.id),
          eq(schema.sharedFamilyTreesSchema.userId, viewer.id),
        ),
      });

      expect(row).toBeDefined();
    });

    it('throws NotFoundException when the tree does not exist', async () => {
      const viewer = await seedUser(getTestDb());

      await expect(
        service.createSharedFamilyTree({
          familyTreeId: '550e8400-e29b-41d4-a716-446655440000',
          userId: viewer.id,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getSharedFamilyTreeUsersById', () => {
    it('returns shared users for the tree owner', async () => {
      const [owner, viewer] = await Promise.all([
        seedUser(getTestDb()),
        seedUser(getTestDb()),
      ]);

      const tree = await seedFamilyTree(getTestDb(), owner.id);

      await share(tree.id, viewer.id);

      const result = await service.getSharedFamilyTreeUsersById(
        owner.id,
        tree.id,
        {
          page: 1,
          perPage: 10,
        },
      );

      expect(result.totalCount).toBe(1);
      expect(result.sharedFamilyTreeUsers[0].userId).toBe(viewer.id);
    });

    it('throws ForbiddenException when the requester is not the owner', async () => {
      const [owner, stranger] = await Promise.all([
        seedUser(getTestDb()),
        seedUser(getTestDb()),
      ]);

      const tree = await seedFamilyTree(getTestDb(), owner.id);

      await expect(
        service.getSharedFamilyTreeUsersById(stranger.id, tree.id, {
          page: 1,
          perPage: 10,
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateSharedFamilyTreeById', () => {
    it('persists the updated permission flags', async () => {
      const [owner, viewer] = await Promise.all([
        seedUser(getTestDb()),
        seedUser(getTestDb()),
      ]);

      const tree = await seedFamilyTree(getTestDb(), owner.id);

      await share(tree.id, viewer.id);

      await service.updateSharedFamilyTreeById(viewer.id, tree.id, {
        canAddMembers: true,
        canDeleteMembers: true,
        canEditMembers: false,
        isBlocked: false,
      });

      const row = await getTestDb().query.sharedFamilyTreesSchema.findFirst({
        where: and(
          eq(schema.sharedFamilyTreesSchema.familyTreeId, tree.id),
          eq(schema.sharedFamilyTreesSchema.userId, viewer.id),
        ),
      });

      expect(row?.canAddMembers).toBe(true);
      expect(row?.canDeleteMembers).toBe(true);
    });
  });
});
