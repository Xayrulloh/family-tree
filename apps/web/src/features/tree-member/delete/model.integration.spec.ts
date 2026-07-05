import { UserGenderEnum } from '@family-tree/shared';
import { allSettled, fork } from 'effector';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from '~/shared/api';
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

const previewOk = {
  canDelete: true,
  blockReason: null,
  spouseToDelete: null,
};

describe('tree-member/delete model (integration)', () => {
  afterEach(() => vi.restoreAllMocks());

  it('deleteTrigger opens the modal and fetches the delete preview', async () => {
    const spy = vi
      .spyOn(api.treeMember, 'deletePreview')
      .mockResolvedValue({ data: previewOk } as never);

    const scope = fork();

    await allSettled(model.deleteTrigger, { scope, params: member });

    expect(spy).toHaveBeenCalledWith({
      familyTreeId: 'tree-1',
      id: 'm-1',
      scope: 'owner',
    });

    expect(scope.getState(model.disclosure.$isOpen)).toBe(true);
    expect(scope.getState(model.$preview)).toEqual(previewOk);
  });

  it('stores a blocked preview when the fetch fails', async () => {
    vi.spyOn(api.treeMember, 'deletePreview').mockRejectedValue(
      new Error('boom'),
    );

    const scope = fork();

    await allSettled(model.deleteTrigger, { scope, params: member });

    expect(scope.getState(model.$preview)).toEqual({
      canDelete: false,
      blockReason: 'Failed to load delete preview. Please try again.',
      spouseToDelete: null,
    });
  });

  it('deleted calls api.treeMember.delete with the member scope', async () => {
    vi.spyOn(api.treeMember, 'deletePreview').mockResolvedValue({
      data: previewOk,
    } as never);

    const deleteSpy = vi
      .spyOn(api.treeMember, 'delete')
      .mockResolvedValue({ data: {} } as never);

    const scope = fork();

    await allSettled(model.deleteTrigger, { scope, params: member });
    await allSettled(model.deleted, { scope });

    expect(deleteSpy).toHaveBeenCalledWith({
      familyTreeId: 'tree-1',
      id: 'm-1',
      scope: 'owner',
    });
  });

  it('closes the modal and resets state after a successful delete', async () => {
    vi.spyOn(api.treeMember, 'deletePreview').mockResolvedValue({
      data: previewOk,
    } as never);

    vi.spyOn(api.treeMember, 'delete').mockResolvedValue({ data: {} } as never);

    const scope = fork();

    await allSettled(model.deleteTrigger, { scope, params: member });
    await allSettled(model.deleted, { scope });

    expect(scope.getState(model.disclosure.$isOpen)).toBe(false);
    expect(scope.getState(model.$member)).toBeNull();
    expect(scope.getState(model.$preview)).toBeNull();
  });

  it('closes the modal when the delete fails', async () => {
    vi.spyOn(api.treeMember, 'deletePreview').mockResolvedValue({
      data: previewOk,
    } as never);

    vi.spyOn(api.treeMember, 'delete').mockRejectedValue(new Error('boom'));

    const scope = fork();

    await allSettled(model.deleteTrigger, { scope, params: member });
    await allSettled(model.deleted, { scope });

    expect(scope.getState(model.disclosure.$isOpen)).toBe(false);
  });
});
