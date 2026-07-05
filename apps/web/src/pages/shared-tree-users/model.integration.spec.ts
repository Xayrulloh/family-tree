import { createRoute } from 'atomic-router';
import { allSettled, fork } from 'effector';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { factory } from './model';

describe('pages/shared-tree-users factory (integration)', () => {
  afterEach(() => vi.restoreAllMocks());

  describe('initial state', () => {
    it('$paginatedUsers starts with an empty list', () => {
      const route = createRoute<{ id: string }>();
      const model = factory({ route });
      const scope = fork();

      expect(
        scope.getState(model.$paginatedUsers).sharedFamilyTreeUsers,
      ).toHaveLength(0);
    });

    it('$page starts at 1', () => {
      const route = createRoute<{ id: string }>();
      const model = factory({ route });
      const scope = fork();

      expect(scope.getState(model.$page)).toBe(1);
    });

    it('$searchQuery starts as empty string', () => {
      const route = createRoute<{ id: string }>();
      const model = factory({ route });
      const scope = fork();

      expect(scope.getState(model.$searchQuery)).toBe('');
    });
  });

  describe('pagination', () => {
    it('pageChanged updates $page', async () => {
      const route = createRoute<{ id: string }>();
      const model = factory({ route });
      const scope = fork();

      await allSettled(model.pageChanged, { scope, params: 3 });

      expect(scope.getState(model.$page)).toBe(3);
    });
  });

  describe('search', () => {
    it('searchChanged updates $searchQuery', async () => {
      const route = createRoute<{ id: string }>();
      const model = factory({ route });
      const scope = fork();

      await allSettled(model.searchChanged, { scope, params: 'Alice' });

      expect(scope.getState(model.$searchQuery)).toBe('Alice');
    });
  });
});
