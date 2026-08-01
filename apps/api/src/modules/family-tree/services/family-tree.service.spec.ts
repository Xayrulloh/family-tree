/// <reference types="jest" />
import { FamilyTreeService } from './family-tree.service';

describe('FamilyTreeService (unit)', () => {
  const mockCloudflareConfig = {
    deleteFile: jest.fn(),
    uploadFile: jest.fn(),
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('incrementPublicFamilyTreeVisitCount', () => {
    it('increments in a single statement without touching updatedAt', async () => {
      const execute = jest.fn().mockResolvedValue(undefined);
      const update = jest.fn();
      const mockDb = { execute, update } as any;
      const service = new FamilyTreeService(
        mockDb,
        mockCloudflareConfig as any,
      );

      await service.incrementPublicFamilyTreeVisitCount('tree-1');

      // `.update()` would fire drizzle's $onUpdate hook and bump updatedAt,
      // marking a tree as modified every time it is merely viewed. The emitted
      // SQL itself is verified against real Postgres in the integration spec.
      expect(update).not.toHaveBeenCalled();
      expect(execute).toHaveBeenCalledTimes(1);
    });
  });

  describe('ordering', () => {
    function setup(familyTrees: unknown[]) {
      const findMany = jest.fn().mockResolvedValue(familyTrees);
      const countBuilder: any = {
        from: jest.fn(() => countBuilder),
        where: jest.fn(() => countBuilder),
        then: (resolve: (value: unknown) => void) =>
          resolve([{ totalCount: familyTrees.length }]),
      };
      const mockDb = {
        select: jest.fn(() => countBuilder),
        query: { familyTreesSchema: { findMany } },
      } as any;

      return {
        findMany,
        service: new FamilyTreeService(mockDb, mockCloudflareConfig as any),
      };
    }

    it('ranks the public listing by visit count, newest and id as tiebreakers', async () => {
      const { findMany, service } = setup([{ id: 'tree-1' }]);

      const result = await service.getPublicFamilyTrees({
        page: 1,
        perPage: 10,
      });

      const { orderBy } = findMany.mock.calls[0][0];

      // A total order matters: without a unique final key, LIMIT/OFFSET can
      // repeat or drop a tree across pages.
      expect(orderBy).toHaveLength(3);
      expect(result.familyTrees).toEqual([{ id: 'tree-1' }]);
    });

    it('keeps the owner listing on a single createdAt sort', async () => {
      const { findMany, service } = setup([{ id: 'tree-1' }]);

      await service.getFamilyTreesOfUser('user-1', { page: 1, perPage: 10 });

      const { orderBy } = findMany.mock.calls[0][0];

      expect(Array.isArray(orderBy)).toBe(false);
    });
  });
});
