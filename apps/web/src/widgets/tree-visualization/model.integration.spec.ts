import type { UserResponseType } from '@family-tree/shared';
import { UserGenderEnum } from '@family-tree/shared';
import { createRoute } from 'atomic-router';
import { fork } from 'effector';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from '~/shared/api';
import { closeRoute, openRoute } from '~/test/route-events';
import { createTreeDetailModel } from './model';

type TreeData = {
  id: string;
  name: string;
  createdBy: string;
  isPublic: boolean;
};

const ownerUser: UserResponseType = {
  id: 'u-1',
  email: 'owner@test.com',
  name: 'Owner',
  username: 'owner',
  image: null,
  gender: UserGenderEnum.MALE,
  dob: null,
  dod: null,
  description: null,
  deletedAt: null,
  createdAt: '2020-01-01',
  updatedAt: '2020-01-01',
};

const treeData: TreeData = {
  id: 'tree-1',
  name: 'Smith Family',
  createdBy: 'u-1',
  isPublic: false,
};

const mockMembers = [{ id: 'm-1', name: 'Alice' }];
const mockConnections = [{ fromMemberId: 'm-1', toMemberId: 'm-2' }];

function makeLocalModel(
  overrides: Partial<
    Parameters<typeof createTreeDetailModel<TreeData>>[0]
  > = {},
) {
  const localRoute = createRoute<{ id: string }>();
  const localModel = createTreeDetailModel<TreeData>({
    route: localRoute,
    scope: 'owner',
    requireAuth: false,
    fetchTree: vi.fn().mockResolvedValue({ data: treeData }),
    resolvePermissions: () => ({
      canAdd: true,
      canEdit: true,
      canDelete: true,
      canManageSharedUsers: true,
    }),
    getName: (t) => t.name,
    ...overrides,
  });
  return { localRoute, localModel };
}

describe('createTreeDetailModel (integration)', () => {
  afterEach(() => vi.restoreAllMocks());

  it('fetches members and connections when the route opens', async () => {
    const fetchTree = vi.fn().mockResolvedValue({ data: treeData });

    vi.spyOn(api.treeMember, 'findAll').mockResolvedValue({
      data: mockMembers,
    } as unknown as Awaited<ReturnType<typeof api.treeMember.findAll>>);

    vi.spyOn(api.treeMemberConnection, 'findAll').mockResolvedValue({
      data: mockConnections,
    } as unknown as Awaited<
      ReturnType<typeof api.treeMemberConnection.findAll>
    >);

    const { localRoute, localModel } = makeLocalModel({ fetchTree });

    const scope = fork();

    await openRoute(localRoute, scope, { id: 'tree-1' });

    expect(fetchTree).toHaveBeenCalledWith('tree-1');
    expect(scope.getState(localModel.$members)).toEqual(mockMembers);
    expect(scope.getState(localModel.$connections)).toEqual(mockConnections);
  });

  it('$id reflects the route param', async () => {
    vi.spyOn(api.treeMember, 'findAll').mockResolvedValue({
      data: [],
    } as unknown as Awaited<ReturnType<typeof api.treeMember.findAll>>);

    vi.spyOn(api.treeMemberConnection, 'findAll').mockResolvedValue({
      data: [],
    } as unknown as Awaited<
      ReturnType<typeof api.treeMemberConnection.findAll>
    >);

    const { localRoute, localModel } = makeLocalModel();

    const scope = fork();

    await openRoute(localRoute, scope, { id: 'tree-42' });

    expect(scope.getState(localModel.$id)).toBe('tree-42');
  });

  it('$treeName is derived from the tree payload', async () => {
    vi.spyOn(api.treeMember, 'findAll').mockResolvedValue({
      data: [],
    } as unknown as Awaited<ReturnType<typeof api.treeMember.findAll>>);

    vi.spyOn(api.treeMemberConnection, 'findAll').mockResolvedValue({
      data: [],
    } as unknown as Awaited<
      ReturnType<typeof api.treeMemberConnection.findAll>
    >);

    const { localRoute, localModel } = makeLocalModel();

    const scope = fork();

    await openRoute(localRoute, scope, { id: 'tree-1' });

    expect(scope.getState(localModel.$treeName)).toBe('Smith Family');
  });

  it('$permissions are resolved from the tree and current user', async () => {
    vi.spyOn(api.treeMember, 'findAll').mockResolvedValue({
      data: [],
    } as unknown as Awaited<ReturnType<typeof api.treeMember.findAll>>);

    vi.spyOn(api.treeMemberConnection, 'findAll').mockResolvedValue({
      data: [],
    } as unknown as Awaited<
      ReturnType<typeof api.treeMemberConnection.findAll>
    >);

    const { $user } = await import('~/entities/user/model');
    const { localRoute, localModel } = makeLocalModel({
      resolvePermissions: (tree, user) => ({
        canAdd: tree.createdBy === user?.id,
        canEdit: false,
        canDelete: false,
        canManageSharedUsers: false,
      }),
    });

    const scope = fork({ values: [[$user, ownerUser]] });

    await openRoute(localRoute, scope, { id: 'tree-1' });

    expect(scope.getState(localModel.$permissions).canAdd).toBe(true);
  });

  it('reinits stores when the route closes', async () => {
    vi.spyOn(api.treeMember, 'findAll').mockResolvedValue({
      data: mockMembers,
    } as unknown as Awaited<ReturnType<typeof api.treeMember.findAll>>);

    vi.spyOn(api.treeMemberConnection, 'findAll').mockResolvedValue({
      data: mockConnections,
    } as unknown as Awaited<
      ReturnType<typeof api.treeMemberConnection.findAll>
    >);

    const { localRoute, localModel } = makeLocalModel();

    const scope = fork();

    await openRoute(localRoute, scope, { id: 'tree-1' });
    await closeRoute(localRoute, scope);

    expect(scope.getState(localModel.$members)).toEqual([]);
    expect(scope.getState(localModel.$connections)).toEqual([]);
  });
});
