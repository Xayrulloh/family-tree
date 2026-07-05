/// <reference types="jest" />
import { CacheService } from './cache.service';

function makeCache(
  overrides: Partial<{
    get: jest.Mock;
    set: jest.Mock;
    del: jest.Mock;
    mdel: jest.Mock;
    stores: unknown[];
  }> = {},
) {
  return {
    get: jest.fn().mockResolvedValue(undefined),
    set: jest.fn().mockResolvedValue(undefined),
    del: jest.fn().mockResolvedValue(undefined),
    mdel: jest.fn().mockResolvedValue(undefined),
    stores: [],
    ...overrides,
  };
}

describe('CacheService', () => {
  describe('get', () => {
    it('returns the cached value when present', async () => {
      const cache = makeCache({
        get: jest.fn().mockResolvedValue({ id: '1' }),
      });

      const service = new CacheService(cache as any);

      const result = await service.get('key');

      expect(result).toEqual({ id: '1' });
    });

    it('returns null when the cache returns undefined', async () => {
      const cache = makeCache({ get: jest.fn().mockResolvedValue(undefined) });
      const service = new CacheService(cache as any);

      expect(await service.get('key')).toBeNull();
    });

    it('returns null and does not throw when the cache throws', async () => {
      const cache = makeCache({
        get: jest.fn().mockRejectedValue(new Error('Redis down')),
      });

      const service = new CacheService(cache as any);

      await expect(service.get('key')).resolves.toBeNull();
    });
  });

  describe('set', () => {
    it('calls cache.set with the key and value', async () => {
      const mockSet = jest.fn().mockResolvedValue(undefined);
      const service = new CacheService(makeCache({ set: mockSet }) as any);

      await service.set('key', { data: true });

      expect(mockSet).toHaveBeenCalledWith('key', { data: true }, undefined);
    });

    it('does not throw when cache.set throws', async () => {
      const service = new CacheService(
        makeCache({
          set: jest.fn().mockRejectedValue(new Error('Redis down')),
        }) as any,
      );

      await expect(service.set('key', {})).resolves.toBeUndefined();
    });
  });

  describe('del', () => {
    it('calls cache.del with the key', async () => {
      const mockDel = jest.fn().mockResolvedValue(undefined);
      const service = new CacheService(makeCache({ del: mockDel }) as any);

      await service.del('key');

      expect(mockDel).toHaveBeenCalledWith('key');
    });

    it('does not throw when cache.del throws', async () => {
      const service = new CacheService(
        makeCache({
          del: jest.fn().mockRejectedValue(new Error('Redis down')),
        }) as any,
      );

      await expect(service.del('key')).resolves.toBeUndefined();
    });
  });

  describe('delByPattern', () => {
    it('deletes all keys matching the pattern', async () => {
      const mockKeys = jest.fn().mockResolvedValue(['a:1', 'a:2']);
      const mockMdel = jest.fn().mockResolvedValue(undefined);

      const cache = makeCache({
        mdel: mockMdel,
        stores: [{ opts: { store: { client: { keys: mockKeys } } } }],
      });

      const service = new CacheService(cache as any);

      await service.delByPattern('a:*');

      expect(mockKeys).toHaveBeenCalledWith('a:*');
      expect(mockMdel).toHaveBeenCalledWith(['a:1', 'a:2']);
    });

    it('skips deletion when no keys match the pattern', async () => {
      const mockKeys = jest.fn().mockResolvedValue([]);
      const mockMdel = jest.fn();

      const cache = makeCache({
        mdel: mockMdel,
        stores: [{ opts: { store: { client: { keys: mockKeys } } } }],
      });

      const service = new CacheService(cache as any);

      await service.delByPattern('missing:*');

      expect(mockMdel).not.toHaveBeenCalled();
    });

    it('warns when no Redis client is available', async () => {
      const service = new CacheService(makeCache({ stores: [{}] }) as any);
      const warnSpy = jest
        .spyOn((service as any).logger, 'warn')
        .mockImplementation(() => {});

      await expect(service.delByPattern('a:*')).resolves.toBeUndefined();

      expect(warnSpy).toHaveBeenCalledWith(
        'Redis client not found or does not support pattern matching',
      );
    });

    it('does not throw when the Redis client throws', async () => {
      const cache = makeCache({
        stores: [
          {
            opts: {
              store: {
                client: {
                  keys: jest.fn().mockRejectedValue(new Error('fail')),
                },
              },
            },
          },
        ],
      });

      const service = new CacheService(cache as any);

      await expect(service.delByPattern('a:*')).resolves.toBeUndefined();
    });
  });

  describe('domain key helpers', () => {
    it('getUserFamilyTrees / setUserFamilyTrees use a stable query-keyed cache key', async () => {
      const mockGet = jest.fn().mockResolvedValue(null);
      const mockSet = jest.fn().mockResolvedValue(undefined);

      const service = new CacheService(
        makeCache({ get: mockGet, set: mockSet }) as any,
      );

      const query = { page: 1, perPage: 10 };

      await service.getUserFamilyTrees('u-1', query);

      expect(mockGet).toHaveBeenCalledWith(
        'users:u-1:family-trees:{"page":1,"perPage":10}',
      );

      await service.setUserFamilyTrees('u-1', query, {} as any);

      expect(mockSet).toHaveBeenCalledWith(
        'users:u-1:family-trees:{"page":1,"perPage":10}',
        {},
        undefined,
      );
    });

    it('getFamilyTreeMembers / setFamilyTreeMembers key by treeId', async () => {
      const mockGet = jest.fn().mockResolvedValue(null);
      const mockSet = jest.fn().mockResolvedValue(undefined);

      const service = new CacheService(
        makeCache({ get: mockGet, set: mockSet }) as any,
      );

      await service.getFamilyTreeMembers('tree-1');

      expect(mockGet).toHaveBeenCalledWith('family-trees:tree-1:members');

      await service.setFamilyTreeMembers('tree-1', [] as any);

      expect(mockSet).toHaveBeenCalledWith(
        'family-trees:tree-1:members',
        [],
        undefined,
      );
    });

    it('getFamilyTreeMemberConnections / setFamilyTreeMemberConnections key by treeId', async () => {
      const mockGet = jest.fn().mockResolvedValue(null);
      const mockSet = jest.fn().mockResolvedValue(undefined);

      const service = new CacheService(
        makeCache({ get: mockGet, set: mockSet }) as any,
      );

      await service.getFamilyTreeMemberConnections('tree-1');

      expect(mockGet).toHaveBeenCalledWith(
        'family-trees:tree-1:members:connections',
      );

      await service.setFamilyTreeMemberConnections('tree-1', [] as any);

      expect(mockSet).toHaveBeenCalledWith(
        'family-trees:tree-1:members:connections',
        [],
        undefined,
      );
    });

    it('getUser / setUser key by userId', async () => {
      const mockGet = jest.fn().mockResolvedValue(null);
      const mockSet = jest.fn().mockResolvedValue(undefined);

      const service = new CacheService(
        makeCache({ get: mockGet, set: mockSet }) as any,
      );

      await service.getUser('u-1');

      expect(mockGet).toHaveBeenCalledWith('users:u-1');

      await service.setUser('u-1', {} as any);

      expect(mockSet).toHaveBeenCalledWith('users:u-1', {}, undefined);
    });
  });
});
