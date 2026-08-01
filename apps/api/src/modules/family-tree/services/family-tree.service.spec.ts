/// <reference types="jest" />
import { FamilyTreeService } from './family-tree.service';

function createSelectBuilder(result: unknown): any {
  const builder: any = {};

  for (const method of [
    'from',
    'leftJoin',
    'where',
    'orderBy',
    'limit',
    'offset',
  ]) {
    builder[method] = jest.fn(() => builder);
  }

  builder.then = (resolve: (value: unknown) => void) => resolve(result);

  return builder;
}

describe('FamilyTreeService (unit)', () => {
  const mockCloudflareConfig = {
    deleteFile: jest.fn(),
    uploadFile: jest.fn(),
  };

  describe('incrementPublicFamilyTreeVisitCount', () => {
    it('upserts the visit row, defaulting to 1 and incrementing on conflict', async () => {
      const onConflictDoUpdate = jest.fn().mockResolvedValue(undefined);
      const values = jest.fn(() => ({ onConflictDoUpdate }));
      const insert = jest.fn(() => ({ values }));
      const mockDb = { insert } as any;
      const service = new FamilyTreeService(
        mockDb,
        mockCloudflareConfig as any,
      );

      await service.incrementPublicFamilyTreeVisitCount('tree-1');

      expect(insert).toHaveBeenCalledTimes(1);
      expect(values).toHaveBeenCalledWith({
        familyTreeId: 'tree-1',
        visitCount: 1,
      });
      expect(onConflictDoUpdate).toHaveBeenCalledTimes(1);

      const [{ target, set }] = onConflictDoUpdate.mock.calls[0];

      expect(target).toBeDefined();
      expect(set.visitCount).toBeDefined();
    });
  });

  describe('getPublicFamilyTrees', () => {
    it('queries via a visits left join instead of the relational findMany path', async () => {
      const familyTrees = [{ id: 'tree-1' }];
      const treesBuilder = createSelectBuilder(familyTrees);
      const countBuilder = createSelectBuilder([{ totalCount: 1 }]);
      const select = jest
        .fn()
        .mockReturnValueOnce(treesBuilder)
        .mockReturnValueOnce(countBuilder);
      const findMany = jest.fn();
      const mockDb = {
        select,
        query: { familyTreesSchema: { findMany } },
      } as any;
      const service = new FamilyTreeService(
        mockDb,
        mockCloudflareConfig as any,
      );

      const result = await service.getPublicFamilyTrees({
        page: 1,
        perPage: 10,
      });

      expect(findMany).not.toHaveBeenCalled();
      expect(treesBuilder.leftJoin).toHaveBeenCalledTimes(1);
      expect(treesBuilder.orderBy).toHaveBeenCalledTimes(1);
      expect(result.familyTrees).toEqual(familyTrees);
      expect(result.totalCount).toBe(1);
    });
  });

  describe('getFamilyTreesOfUser', () => {
    it('uses the relational findMany path, not the visits join', async () => {
      const familyTrees = [{ id: 'tree-1' }];
      const countBuilder = createSelectBuilder([{ totalCount: 1 }]);
      const select = jest.fn(() => countBuilder);
      const findMany = jest.fn().mockResolvedValue(familyTrees);
      const mockDb = {
        select,
        query: { familyTreesSchema: { findMany } },
      } as any;
      const service = new FamilyTreeService(
        mockDb,
        mockCloudflareConfig as any,
      );

      const result = await service.getFamilyTreesOfUser('user-1', {
        page: 1,
        perPage: 10,
      });

      expect(findMany).toHaveBeenCalledTimes(1);
      expect(result.familyTrees).toEqual(familyTrees);
    });
  });
});
