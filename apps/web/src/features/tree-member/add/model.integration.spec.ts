import { UserGenderEnum } from '@family-tree/shared';
import { allSettled, fork } from 'effector';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from '~/shared/api';
import { $treeScope } from '~/shared/config/tree-scope';
import * as model from './model';

const member = {
  id: 'm-1',
  familyTreeId: 'tree-1',
  name: 'Dad',
  gender: UserGenderEnum.MALE,
  image: null,
  dob: null,
  dod: null,
  description: null,
  createdAt: '2020-01-01',
  updatedAt: '2020-01-01',
  deletedAt: null,
} as never;

describe('tree-member/add model (integration)', () => {
  afterEach(() => vi.restoreAllMocks());

  it('addBoyTrigger creates a MALE child for the owner scope', async () => {
    const spy = vi
      .spyOn(api.treeMember, 'createChild')
      .mockResolvedValue({ data: { id: 'new-1' } } as never);

    const scope = fork();

    await allSettled(model.addBoyTrigger, { scope, params: member });

    expect(spy).toHaveBeenCalledWith(
      { familyTreeId: 'tree-1', scope: 'owner' },
      { gender: UserGenderEnum.MALE, fromMemberId: 'm-1' },
    );
  });

  it('addGirlTrigger creates a FEMALE child', async () => {
    const spy = vi
      .spyOn(api.treeMember, 'createChild')
      .mockResolvedValue({ data: { id: 'new-1' } } as never);

    const scope = fork();

    await allSettled(model.addGirlTrigger, { scope, params: member });

    expect(spy).toHaveBeenCalledWith(
      { familyTreeId: 'tree-1', scope: 'owner' },
      { gender: UserGenderEnum.FEMALE, fromMemberId: 'm-1' },
    );
  });

  it('addSpouseTrigger creates a spouse', async () => {
    const spy = vi
      .spyOn(api.treeMember, 'createSpouse')
      .mockResolvedValue({ data: { id: 'new-1' } } as never);

    const scope = fork();

    await allSettled(model.addSpouseTrigger, { scope, params: member });

    expect(spy).toHaveBeenCalledWith(
      { familyTreeId: 'tree-1', scope: 'owner' },
      { fromMemberId: 'm-1' },
    );
  });

  it('addParentsTrigger creates parents', async () => {
    const spy = vi
      .spyOn(api.treeMember, 'createParents')
      .mockResolvedValue({ data: { id: 'new-1' } } as never);

    const scope = fork();

    await allSettled(model.addParentsTrigger, { scope, params: member });

    expect(spy).toHaveBeenCalledWith(
      { familyTreeId: 'tree-1', scope: 'owner' },
      { fromMemberId: 'm-1' },
    );
  });

  it('honours a non-owner tree scope', async () => {
    const spy = vi
      .spyOn(api.treeMember, 'createChild')
      .mockResolvedValue({ data: { id: 'new-1' } } as never);

    const scope = fork({ values: [[$treeScope, 'shared']] });

    await allSettled(model.addBoyTrigger, { scope, params: member });

    expect(spy).toHaveBeenCalledWith(
      { familyTreeId: 'tree-1', scope: 'shared' },
      { gender: UserGenderEnum.MALE, fromMemberId: 'm-1' },
    );
  });

  it('captures the last added member id for child/spouse adds', async () => {
    vi.spyOn(api.treeMember, 'createChild').mockResolvedValue({
      data: { id: 'new-1' },
    } as never);

    const scope = fork();

    await allSettled(model.addBoyTrigger, { scope, params: member });

    expect(scope.getState(model.$lastAddedMemberId)).toBe('new-1');
  });

  it('does not capture a last added member id for parent adds', async () => {
    vi.spyOn(api.treeMember, 'createParents').mockResolvedValue({
      data: { id: 'p-1' },
    } as never);

    const scope = fork();

    await allSettled(model.addParentsTrigger, { scope, params: member });

    expect(scope.getState(model.$lastAddedMemberId)).toBeNull();
  });

  it('resets the source member after an add completes', async () => {
    vi.spyOn(api.treeMember, 'createChild').mockResolvedValue({
      data: { id: 'new-1' },
    } as never);

    const scope = fork();

    await allSettled(model.addBoyTrigger, { scope, params: member });

    expect(scope.getState(model.$member)).toBeNull();
  });

  it('lastAddedMemberIdTrigger clears the captured id', async () => {
    vi.spyOn(api.treeMember, 'createChild').mockResolvedValue({
      data: { id: 'new-1' },
    } as never);

    const scope = fork();

    await allSettled(model.addBoyTrigger, { scope, params: member });
    await allSettled(model.lastAddedMemberIdTrigger, { scope });

    expect(scope.getState(model.$lastAddedMemberId)).toBeNull();
  });

  it('preserves $member and leaves $lastAddedMemberId null when createChild fails', async () => {
    vi.spyOn(api.treeMember, 'createChild').mockRejectedValue(
      new Error('network error'),
    );

    const scope = fork();

    await allSettled(model.addBoyTrigger, { scope, params: member });

    expect(scope.getState(model.$member)).toEqual(member);
    expect(scope.getState(model.$lastAddedMemberId)).toBeNull();
  });
});
