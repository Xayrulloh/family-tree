import type { FamilyTreeSharedUserResponseType } from '@family-tree/shared';
import { UserGenderEnum } from '@family-tree/shared';
import { allSettled, fork } from 'effector';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from '~/shared/api';
import * as model from './model';

const sharedUser: FamilyTreeSharedUserResponseType = {
  familyTreeId: 'tree-1',
  userId: 'user-9',
  email: 'user9@test.com',
  name: 'User Nine',
  image: null,
  gender: UserGenderEnum.UNKNOWN,
  dob: null,
  dod: null,
  description: null,
  canAddMembers: true,
  canEditMembers: false,
  canDeleteMembers: true,
  isBlocked: false,
  deletedAt: null,
  createdAt: '2020-01-01',
  updatedAt: '2020-01-01',
};

describe('shared-tree-users/edit model (integration)', () => {
  afterEach(() => vi.restoreAllMocks());

  it('editTrigger calls api.sharedTree.update with mapped param and body', async () => {
    const updateSpy = vi
      .spyOn(api.sharedTree, 'update')
      .mockResolvedValue({ data: undefined } as any);

    const scope = fork();

    await allSettled(model.editTrigger, { scope, params: sharedUser });

    expect(updateSpy).toHaveBeenCalledWith(
      { familyTreeId: 'tree-1', userId: 'user-9' },
      {
        canAddMembers: true,
        canEditMembers: false,
        canDeleteMembers: true,
        isBlocked: false,
      },
    );
  });

  it('resets $sharedTree after a successful update', async () => {
    vi.spyOn(api.sharedTree, 'update').mockResolvedValue({
      data: undefined,
    } as any);

    const scope = fork();

    await allSettled(model.editTrigger, { scope, params: sharedUser });

    expect(scope.getState(model.$sharedTree)).toBeNull();
  });
});
