import { createRoute } from 'atomic-router';
import { allSettled, fork } from 'effector';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { $session, SessionStatus } from '~/entities/user/model';
import { api } from '~/shared/api';
import { openRoute } from '~/test/route-events';
import { factory } from './model';

const emptyTreePage = {
  page: 1,
  perPage: 15,
  totalCount: 0,
  totalPages: 0,
  familyTrees: [],
};
const emptySharedPage = {
  page: 1,
  perPage: 15,
  totalCount: 0,
  totalPages: 0,
  sharedFamilyTrees: [],
};

function mockApis() {
  vi.spyOn(api.tree, 'findAll').mockResolvedValue({
    data: emptyTreePage,
  } as never);

  vi.spyOn(api.sharedTree, 'findAll').mockResolvedValue({
    data: emptySharedPage,
  } as never);

  vi.spyOn(api.tree, 'findAllPublic').mockResolvedValue({
    data: emptyTreePage,
  } as never);
}

describe('pages/tree-list factory (integration)', () => {
  const testRoute = createRoute();

  let model: ReturnType<typeof factory>;

  beforeAll(() => {
    model = factory({ route: testRoute, initialMode: 'public-trees' });
  });

  afterEach(() => vi.restoreAllMocks());

  describe('initial state', () => {
    it('$mode starts as public-trees when initialMode is public-trees', () => {
      const scope = fork();

      expect(scope.getState(model.$mode)).toBe('public-trees');
    });

    it('$myTreesPage starts at 1', () => {
      const scope = fork();

      expect(scope.getState(model.$myTreesPage)).toBe(1);
    });
  });

  describe('route open', () => {
    it('fetches public trees when the route opens', async () => {
      mockApis();

      const scope = fork({ values: [[$session, SessionStatus.Authorized]] });

      await openRoute(testRoute, scope);

      expect(api.tree.findAllPublic).toHaveBeenCalled();
    });

    it('fetches public trees for unauthenticated users (uses route.opened, not authorizedRoute.opened)', async () => {
      mockApis();
      // UnAuthorized (not Initial) so chainAuthorized skips sessionFx.
      const scope = fork({ values: [[$session, SessionStatus.UnAuthorized]] });

      await openRoute(testRoute, scope);

      expect(api.tree.findAllPublic).toHaveBeenCalled();
      expect(api.tree.findAll).not.toHaveBeenCalled();
    });
  });

  describe('mode switching', () => {
    it('myTreesTriggered sets $mode to my-trees', async () => {
      const scope = fork();

      await allSettled(model.myTreesTriggered, { scope });

      expect(scope.getState(model.$mode)).toBe('my-trees');
    });

    it('sharedTreesTriggered sets $mode to shared-trees', async () => {
      const scope = fork();

      await allSettled(model.sharedTreesTriggered, { scope });

      expect(scope.getState(model.$mode)).toBe('shared-trees');
    });

    it('publicTreesTriggered sets $mode to public-trees', async () => {
      const scope = fork({ values: [[model.$mode, 'my-trees']] });

      await allSettled(model.publicTreesTriggered, { scope });

      expect(scope.getState(model.$mode)).toBe('public-trees');
    });
  });

  describe('pagination', () => {
    it('myTreesPageChanged updates $myTreesPage', async () => {
      mockApis();

      const scope = fork({ values: [[$session, SessionStatus.Authorized]] });

      await allSettled(model.myTreesPageChanged, { scope, params: 3 });

      expect(scope.getState(model.$myTreesPage)).toBe(3);
    });

    it('sharedTreesPageChanged updates $sharedTreesPage', async () => {
      mockApis();

      const scope = fork({ values: [[$session, SessionStatus.Authorized]] });

      await allSettled(model.sharedTreesPageChanged, { scope, params: 2 });

      expect(scope.getState(model.$sharedTreesPage)).toBe(2);
    });

    it('publicTreesPageChanged updates $publicTreesPage', async () => {
      mockApis();

      const scope = fork();

      await allSettled(model.publicTreesPageChanged, { scope, params: 4 });

      expect(scope.getState(model.$publicTreesPage)).toBe(4);
    });
  });

  describe('fetch result stored', () => {
    it('stores the fetchAllPublic response in $paginatedPublicTrees', async () => {
      const publicData = {
        ...emptyTreePage,
        totalCount: 5,
        familyTrees: [{ id: 't-1' }],
      };

      mockApis();
      vi.spyOn(api.tree, 'findAllPublic').mockResolvedValue({
        data: publicData,
      } as never);

      const scope = fork({ values: [[$session, SessionStatus.Authorized]] });

      await openRoute(testRoute, scope);

      expect(scope.getState(model.$paginatedPublicTrees).totalCount).toBe(5);
    });
  });
});
