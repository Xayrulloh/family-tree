/// <reference types="jest" />
import type { CallHandler, ExecutionContext } from '@nestjs/common';
import { firstValueFrom, of } from 'rxjs';
import type { CacheService } from '../../config/cache/cache.service';
import { FamilyTreeCacheInterceptor } from './family-tree.cache.interceptor';

function makeContext({
  method = 'GET',
  routePath = '/api/family-trees',
  treeId = 'tree-1',
  user = { id: 'u-1' },
}: {
  method?: string;
  routePath?: string;
  treeId?: string;
  user?: { id: string } | null;
} = {}): ExecutionContext {
  const resolvedPath = routePath
    .replace(':familyTreeId', treeId)
    .replace(':id', treeId);

  return {
    switchToHttp: () => ({
      getRequest: () => ({
        method,
        user,
        query: { page: 1, perPage: 10 },
        params: { familyTreeId: treeId, id: treeId },
        route: { path: routePath },
        path: resolvedPath,
      }),
    }),
  } as unknown as ExecutionContext;
}

function makeNext(value: unknown = {}): CallHandler {
  return { handle: () => of(value) } as CallHandler;
}

function makeCacheService(): jest.Mocked<CacheService> {
  return {
    getUserFamilyTrees: jest.fn().mockResolvedValue(null),
    setUserFamilyTrees: jest.fn().mockResolvedValue(undefined),
    cleanUserFamilyTrees: jest.fn().mockResolvedValue(undefined),
    getFamilyTreeMembers: jest.fn().mockResolvedValue(null),
    setFamilyTreeMembers: jest.fn().mockResolvedValue(undefined),
    cleanFamilyTreeMembers: jest.fn().mockResolvedValue(undefined),
    getFamilyTreeMemberConnections: jest.fn().mockResolvedValue(null),
    setFamilyTreeMemberConnections: jest.fn().mockResolvedValue(undefined),
    cleanFamilyTreeMemberConnections: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<CacheService>;
}

describe('FamilyTreeCacheInterceptor', () => {
  describe('GET /api/family-trees — tree list', () => {
    it('returns cached list when warm', async () => {
      const cached = [{ id: 'tree-1' }];
      const cache = makeCacheService();

      cache.getUserFamilyTrees.mockResolvedValue(cached as any);

      const interceptor = new FamilyTreeCacheInterceptor(cache);

      const result$ = await interceptor.intercept(
        makeContext({ routePath: '/api/family-trees' }),
        makeNext([]),
      );

      expect(await firstValueFrom(result$)).toEqual(cached);
    });

    it('populates the cache after a cold GET', async () => {
      const fresh = [{ id: 'tree-1' }];
      const cache = makeCacheService();
      const interceptor = new FamilyTreeCacheInterceptor(cache);

      const result$ = await interceptor.intercept(
        makeContext({ routePath: '/api/family-trees' }),
        makeNext(fresh),
      );

      await firstValueFrom(result$);

      expect(cache.setUserFamilyTrees).toHaveBeenCalledWith(
        'u-1',
        { page: 1, perPage: 10 },
        fresh,
      );
    });
  });

  describe('GET members path', () => {
    it('returns cached members when warm', async () => {
      const cached = [{ id: 'm-1' }];
      const cache = makeCacheService();

      cache.getFamilyTreeMembers.mockResolvedValue(cached as any);

      const interceptor = new FamilyTreeCacheInterceptor(cache);

      const result$ = await interceptor.intercept(
        makeContext({ routePath: '/api/family-trees/:familyTreeId/members' }),
        makeNext([]),
      );

      expect(await firstValueFrom(result$)).toEqual(cached);
    });

    it('populates the members cache after a cold GET', async () => {
      const fresh = [{ id: 'm-1' }];
      const cache = makeCacheService();
      const interceptor = new FamilyTreeCacheInterceptor(cache);

      const result$ = await interceptor.intercept(
        makeContext({ routePath: '/api/family-trees/:familyTreeId/members' }),
        makeNext(fresh),
      );

      await firstValueFrom(result$);

      expect(cache.setFamilyTreeMembers).toHaveBeenCalledWith('tree-1', fresh);
    });
  });

  describe('GET connections path', () => {
    it('returns cached connections when warm', async () => {
      const cached = [{ fromMemberId: 'm-1' }];
      const cache = makeCacheService();

      cache.getFamilyTreeMemberConnections.mockResolvedValue(cached as any);

      const interceptor = new FamilyTreeCacheInterceptor(cache);

      const result$ = await interceptor.intercept(
        makeContext({
          routePath: '/api/family-trees/:familyTreeId/members/connections',
        }),
        makeNext([]),
      );

      expect(await firstValueFrom(result$)).toEqual(cached);
    });
  });

  describe('mutations — no user', () => {
    it('passes through without cache interaction when user is absent', async () => {
      const cache = makeCacheService();
      const interceptor = new FamilyTreeCacheInterceptor(cache);

      const result$ = await interceptor.intercept(
        makeContext({
          method: 'POST',
          routePath: '/api/family-trees',
          user: null,
        }),
        makeNext({}),
      );

      await firstValueFrom(result$);

      expect(cache.cleanUserFamilyTrees).not.toHaveBeenCalled();
      expect(cache.cleanFamilyTreeMembers).not.toHaveBeenCalled();
    });
  });

  describe('mutations — tree level', () => {
    it('clears tree list on POST /api/family-trees', async () => {
      const cache = makeCacheService();
      const interceptor = new FamilyTreeCacheInterceptor(cache);

      const result$ = await interceptor.intercept(
        makeContext({ method: 'POST', routePath: '/api/family-trees' }),
        makeNext({}),
      );

      await firstValueFrom(result$);

      expect(cache.cleanUserFamilyTrees).toHaveBeenCalledWith('u-1');
      expect(cache.cleanFamilyTreeMembers).not.toHaveBeenCalled();
    });

    it('clears tree list, members and connections on DELETE /api/family-trees/:id', async () => {
      const cache = makeCacheService();
      const interceptor = new FamilyTreeCacheInterceptor(cache);

      const result$ = await interceptor.intercept(
        makeContext({ method: 'DELETE', routePath: '/api/family-trees/:id' }),
        makeNext({}),
      );

      await firstValueFrom(result$);

      expect(cache.cleanUserFamilyTrees).toHaveBeenCalledWith('u-1');
      expect(cache.cleanFamilyTreeMembers).toHaveBeenCalledWith('tree-1');
      expect(cache.cleanFamilyTreeMemberConnections).toHaveBeenCalledWith(
        'tree-1',
      );
    });
  });

  describe('mutations — member level', () => {
    it('clears only members on PUT /members', async () => {
      const cache = makeCacheService();
      const interceptor = new FamilyTreeCacheInterceptor(cache);

      const result$ = await interceptor.intercept(
        makeContext({
          method: 'PUT',
          routePath: '/api/family-trees/:familyTreeId/members/:id',
        }),
        makeNext({}),
      );

      await firstValueFrom(result$);

      expect(cache.cleanFamilyTreeMembers).toHaveBeenCalledWith('tree-1');
      expect(cache.cleanFamilyTreeMemberConnections).not.toHaveBeenCalled();
    });

    it('clears members and connections on POST /members (add child)', async () => {
      const cache = makeCacheService();
      const interceptor = new FamilyTreeCacheInterceptor(cache);

      const result$ = await interceptor.intercept(
        makeContext({
          method: 'POST',
          routePath: '/api/family-trees/:familyTreeId/members/child',
        }),
        makeNext({}),
      );

      await firstValueFrom(result$);

      expect(cache.cleanFamilyTreeMembers).toHaveBeenCalledWith('tree-1');
      expect(cache.cleanFamilyTreeMemberConnections).toHaveBeenCalledWith(
        'tree-1',
      );
    });

    it('clears members and connections on DELETE /members/:id', async () => {
      const cache = makeCacheService();
      const interceptor = new FamilyTreeCacheInterceptor(cache);

      const result$ = await interceptor.intercept(
        makeContext({
          method: 'DELETE',
          routePath: '/api/family-trees/:familyTreeId/members/:id',
        }),
        makeNext({}),
      );

      await firstValueFrom(result$);

      expect(cache.cleanFamilyTreeMembers).toHaveBeenCalledWith('tree-1');
      expect(cache.cleanFamilyTreeMemberConnections).toHaveBeenCalledWith(
        'tree-1',
      );
    });
  });
});
