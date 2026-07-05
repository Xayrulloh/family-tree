import type { FamilyTreeMemberGetResponseType } from '@family-tree/shared';
import { UserGenderEnum } from '@family-tree/shared';
import { allSettled, fork } from 'effector';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as model from './model';

const member: FamilyTreeMemberGetResponseType = {
  id: 'm-1',
  familyTreeId: 'tree-1',
  name: 'Alice',
  gender: UserGenderEnum.FEMALE,
  image: null,
  dob: null,
  dod: null,
  description: null,
  createdAt: '2020-01-01',
  updatedAt: '2020-01-01',
  deletedAt: null,
};

describe('tree-member/preview model (integration)', () => {
  afterEach(() => vi.restoreAllMocks());

  it('previewMemberTrigger opens the disclosure', async () => {
    const scope = fork();

    await allSettled(model.previewMemberTrigger, { scope, params: member });

    expect(scope.getState(model.disclosure.$isOpen)).toBe(true);
  });

  it('previewMemberTrigger sets $member to the given member', async () => {
    const scope = fork();

    await allSettled(model.previewMemberTrigger, { scope, params: member });

    expect(scope.getState(model.$member)).toEqual(member);
  });

  it('reset closes the disclosure', async () => {
    const scope = fork();

    await allSettled(model.previewMemberTrigger, { scope, params: member });

    await allSettled(model.reset, { scope });

    expect(scope.getState(model.disclosure.$isOpen)).toBe(false);
  });

  it('$member is null before any trigger fires', () => {
    const scope = fork();

    expect(scope.getState(model.$member)).toBeNull();
  });

  it('previewMemberTrigger replaces a previously set member', async () => {
    const other: FamilyTreeMemberGetResponseType = {
      ...member,
      id: 'm-2',
      name: 'Bob',
    };
    const scope = fork();

    await allSettled(model.previewMemberTrigger, { scope, params: member });
    await allSettled(model.previewMemberTrigger, { scope, params: other });

    expect(scope.getState(model.$member)).toEqual(other);
  });
});
