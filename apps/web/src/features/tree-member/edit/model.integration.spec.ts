import { FileUploadFolderEnum, UserGenderEnum } from '@family-tree/shared';
import { allSettled, fork } from 'effector';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from '~/shared/api';
import type { FormValues } from './model';
import * as model from './model';

const memberValues: FormValues = {
  id: 'm-1',
  familyTreeId: 'tree-1',
  name: 'Dad',
  image: 'https://r2.example.com/dad.png',
  gender: UserGenderEnum.MALE,
  dob: null,
  dod: null,
  description: 'desc',
  createdAt: '2020-01-01',
  updatedAt: '2020-01-01',
  deletedAt: null,
};

describe('tree-member/edit model (integration)', () => {
  afterEach(() => vi.restoreAllMocks());

  it('editTrigger opens the modal and stores the original member', async () => {
    const scope = fork();

    await allSettled(model.editTrigger, { scope, params: memberValues });

    expect(scope.getState(model.disclosure.$isOpen)).toBe(true);
    expect(scope.getState(model.$originalMember)).toEqual(memberValues);
  });

  it('updates the member when the image is an existing url', async () => {
    const spy = vi
      .spyOn(api.treeMember, 'update')
      .mockResolvedValue({ data: {} } as never);

    const scope = fork({ values: [[model.form.$formValues, memberValues]] });

    await allSettled(model.editTrigger, { scope, params: memberValues });
    await allSettled(model.formValidated, { scope });

    expect(spy).toHaveBeenCalledWith(
      { familyTreeId: 'tree-1', id: 'm-1', scope: 'owner' },
      memberValues,
    );
  });

  it('uploads a freshly picked blob image before saving', async () => {
    const uploadSpy = vi.spyOn(api.file, 'upload').mockResolvedValue({
      data: { path: 'https://r2.example.com/new.png', message: 'ok' },
    } as never);

    // The upload→setPath→edit chain proceeds even without a real form instance
    // (setPathToFormFx uses optional chaining), so stub the save call too.
    vi.spyOn(api.treeMember, 'update').mockResolvedValue({ data: {} } as never);

    const file = new File(['x'], 'member.png', { type: 'image/png' });
    const scope = fork({
      values: [
        [model.$file, file],
        [model.form.$formValues, { ...memberValues, image: 'blob:preview' }],
      ],
    });

    await allSettled(model.formValidated, { scope });

    expect(uploadSpy).toHaveBeenCalledWith(
      FileUploadFolderEnum.TREE_MEMBER,
      expect.any(FormData),
    );
  });

  it('reset closes the modal', async () => {
    const scope = fork();

    await allSettled(model.editTrigger, { scope, params: memberValues });
    await allSettled(model.reset, { scope });

    expect(scope.getState(model.disclosure.$isOpen)).toBe(false);
  });
});
