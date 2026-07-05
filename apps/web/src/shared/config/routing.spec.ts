import { describe, expect, it } from 'vitest';
import { routes, routesMap } from './routing';

const pathOf = (route: (typeof routesMap)[number]['route']) =>
  routesMap.find((entry) => entry.route === route)?.path;

const indexOf = (path: string) =>
  routesMap.findIndex((entry) => entry.path === path);

describe('routesMap', () => {
  it('maps every route object exactly once', () => {
    const mapped = routesMap.map((entry) => entry.route);
    const named = Object.values(routes).filter(
      (route) => route !== routes.notFound,
    );

    expect(new Set(mapped).size).toBe(routesMap.length);

    for (const route of named) {
      expect(mapped).toContain(route);
    }
  });

  it('binds the expected path to each route', () => {
    expect(pathOf(routes.browse)).toBe('/');
    expect(pathOf(routes.registration)).toBe('/register');
    expect(pathOf(routes.trees)).toBe('/family-trees');
    expect(pathOf(routes.publicTreeList)).toBe('/family-trees/public');
    expect(pathOf(routes.publicTreesDetail)).toBe('/family-trees/public/:id');
    expect(pathOf(routes.sharedTreeList)).toBe('/family-trees/shared');
    expect(pathOf(routes.sharedTreesDetail)).toBe('/family-trees/shared/:id');
    expect(pathOf(routes.sharedTreeUsers)).toBe(
      '/family-trees/shared/:id/users',
    );
    expect(pathOf(routes.treesDetail)).toBe('/family-trees/:id');
  });

  it('lists literal paths before /family-trees/:id so :id does not swallow "public"/"shared"', () => {
    const paramIndex = indexOf('/family-trees/:id');

    expect(indexOf('/family-trees/public')).toBeLessThan(paramIndex);
    expect(indexOf('/family-trees/public/:id')).toBeLessThan(paramIndex);
    expect(indexOf('/family-trees/shared')).toBeLessThan(paramIndex);
    expect(indexOf('/family-trees/shared/:id')).toBeLessThan(paramIndex);
    expect(indexOf('/family-trees/shared/:id/users')).toBeLessThan(paramIndex);
  });
});
