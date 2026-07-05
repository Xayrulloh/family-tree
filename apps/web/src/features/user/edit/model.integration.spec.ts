import type { UserResponseType } from '@family-tree/shared';
import { UserGenderEnum } from '@family-tree/shared';
import { allSettled, fork } from 'effector';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { userModel } from '~/entities/user';
import { api } from '~/shared/api';
import * as model from './model';

const currentUser: UserResponseType = {
  id: 'u-1',
  email: 'alice@test.com',
  name: 'Alice',
  username: 'alice',
  image: 'https://r2.example.com/alice.png',
  gender: UserGenderEnum.FEMALE,
  dob: '1990-01-01',
  dod: null,
  description: null,
  deletedAt: null,
  createdAt: '2020-01-01',
  updatedAt: '2020-01-01',
};

const unchangedValues = {
  name: 'Alice',
  image: 'https://r2.example.com/alice.png',
  gender: UserGenderEnum.FEMALE,
  dob: '1990-01-01',
};

const changedValues = {
  name: 'Bob',
  image: 'https://r2.example.com/bob.png',
  gender: UserGenderEnum.MALE,
  dob: '1991-02-02',
};

describe('user/edit model (integration)', () => {
  afterEach(() => vi.restoreAllMocks());

  it('editTrigger opens the modal', async () => {
    const scope = fork();

    await allSettled(model.editTrigger, {
      scope,
      params: changedValues as never,
    });

    expect(scope.getState(model.disclosure.$isOpen)).toBe(true);
  });

  it('updates the profile and refreshes the session when values change', async () => {
    const updateSpy = vi
      .spyOn(api.user, 'update')
      .mockResolvedValue({ data: {} } as never);

    const sessionHandler = vi.fn().mockResolvedValue({ data: {} });

    const scope = fork({
      values: [
        [userModel.$user, currentUser],
        [model.form.$formValues, changedValues],
      ],
      handlers: [[userModel.sessionFx, sessionHandler]],
    });

    await allSettled(model.formValidated, { scope });

    expect(updateSpy).toHaveBeenCalledWith(changedValues);
    expect(sessionHandler).toHaveBeenCalled();
  });

  it('does not update when the values match the current user', async () => {
    const updateSpy = vi
      .spyOn(api.user, 'update')
      .mockResolvedValue({ data: {} } as never);

    const scope = fork({
      values: [
        [userModel.$user, currentUser],
        [model.form.$formValues, unchangedValues],
      ],
      // Defensive: if the no-change filter ever regresses and editProfileFx
      // fires, this keeps sessionFx from hitting the real /users/me endpoint.
      handlers: [
        [userModel.sessionFx, vi.fn().mockResolvedValue({ data: {} })],
      ],
    });

    await allSettled(model.formValidated, { scope });

    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('requests a random avatar and refreshes the session', async () => {
    const avatarSpy = vi
      .spyOn(api.user, 'randomAvatar')
      .mockResolvedValue({ data: {} } as never);

    const sessionHandler = vi.fn().mockResolvedValue({ data: {} });

    const scope = fork({
      handlers: [[userModel.sessionFx, sessionHandler]],
    });

    await allSettled(model.randomAvatarTrigger, { scope });

    expect(avatarSpy).toHaveBeenCalled();
    expect(sessionHandler).toHaveBeenCalled();
  });
});
