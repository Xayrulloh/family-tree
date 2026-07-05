/// <reference types="jest" />
import type { CallHandler, ExecutionContext } from '@nestjs/common';
import { firstValueFrom, of } from 'rxjs';
import type { CacheService } from '../../config/cache/cache.service';
import { UserCacheInterceptor } from './user.cache.interceptor';

function makeContext({
  method = 'GET',
  routePath = '/api/users/me',
  user = { id: 'u-1' },
  params = {} as Record<string, string>,
}: {
  method?: string;
  routePath?: string;
  user?: { id: string } | null;
  params?: Record<string, string>;
} = {}): ExecutionContext {
  const resolvedPath = routePath.replace(
    /:(\w+)/g,
    (_, key) => params[key] ?? `:${key}`,
  );

  return {
    switchToHttp: () => ({
      getRequest: () => ({
        method,
        user,
        params,
        route: { path: routePath },
        path: resolvedPath,
      }),
    }),
  } as unknown as ExecutionContext;
}

function makeNext(value: unknown = {}): CallHandler {
  return { handle: () => of(value) } as CallHandler;
}

function makeCacheService(
  overrides: Partial<{
    getUser: jest.Mock;
    setUser: jest.Mock;
    cleanUser: jest.Mock;
  }> = {},
): jest.Mocked<CacheService> {
  return {
    getUser: jest.fn().mockResolvedValue(null),
    setUser: jest.fn().mockResolvedValue(undefined),
    cleanUser: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as jest.Mocked<CacheService>;
}

describe('UserCacheInterceptor', () => {
  it('passes through immediately when there is no authenticated user', async () => {
    const cache = makeCacheService();
    const interceptor = new UserCacheInterceptor(cache);
    const payload = { id: 'x' };

    const result$ = await interceptor.intercept(
      makeContext({ user: null }),
      makeNext(payload),
    );

    expect(await firstValueFrom(result$)).toBe(payload);
    expect(cache.getUser).not.toHaveBeenCalled();
  });

  it('returns the cached user on GET /api/users/me when the cache is warm', async () => {
    const cached = { id: 'u-1', name: 'Alice' };
    const cache = makeCacheService({
      getUser: jest.fn().mockResolvedValue(cached),
    });
    const interceptor = new UserCacheInterceptor(cache);

    const result$ = await interceptor.intercept(
      makeContext({ method: 'GET', routePath: '/api/users/me' }),
      makeNext({ id: 'fresh' }),
    );

    expect(await firstValueFrom(result$)).toEqual(cached);
  });

  it('calls next and populates the cache on GET /api/users/me when the cache is cold', async () => {
    const fresh = { id: 'u-1', name: 'Alice' };
    const cache = makeCacheService();
    const interceptor = new UserCacheInterceptor(cache);

    const result$ = await interceptor.intercept(
      makeContext({ method: 'GET', routePath: '/api/users/me' }),
      makeNext(fresh),
    );

    expect(await firstValueFrom(result$)).toBe(fresh);
    expect(cache.setUser).toHaveBeenCalledWith('u-1', fresh);
  });

  it('returns the cached user on GET /api/users/:id when the cache is warm', async () => {
    const cached = { id: 'u-2', name: 'Bob' };
    const cache = makeCacheService({
      getUser: jest.fn().mockResolvedValue(cached),
    });

    const interceptor = new UserCacheInterceptor(cache);

    const result$ = await interceptor.intercept(
      makeContext({
        method: 'GET',
        routePath: '/api/users/:id',
        params: { id: 'u-2' },
      }),
      makeNext({}),
    );

    expect(await firstValueFrom(result$)).toEqual(cached);
  });

  it('invalidates the user cache on PUT /api/users', async () => {
    const cache = makeCacheService();
    const interceptor = new UserCacheInterceptor(cache);

    const result$ = await interceptor.intercept(
      makeContext({ method: 'PUT', routePath: '/api/users' }),
      makeNext({}),
    );

    await firstValueFrom(result$);

    expect(cache.cleanUser).toHaveBeenCalledWith('u-1');
  });

  it('invalidates the user cache on PATCH /api/users', async () => {
    const cache = makeCacheService();
    const interceptor = new UserCacheInterceptor(cache);

    const result$ = await interceptor.intercept(
      makeContext({ method: 'PATCH', routePath: '/api/users/avatar' }),
      makeNext({}),
    );

    await firstValueFrom(result$);

    expect(cache.cleanUser).toHaveBeenCalledWith('u-1');
  });

  it('does not touch the cache for non-user paths', async () => {
    const cache = makeCacheService();
    const interceptor = new UserCacheInterceptor(cache);

    const result$ = await interceptor.intercept(
      makeContext({ method: 'PUT', routePath: '/api/family-trees' }),
      makeNext({}),
    );

    await firstValueFrom(result$);

    expect(cache.cleanUser).not.toHaveBeenCalled();
  });
});
