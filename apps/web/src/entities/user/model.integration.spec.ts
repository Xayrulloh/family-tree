import type { UserResponseType } from '@family-tree/shared';
import { UserGenderEnum } from '@family-tree/shared';
import { allSettled, fork } from 'effector';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from '~/shared/api';
import userModel, { $session, $user, SessionStatus, sessionFx } from './model';

const { loggedIn, loggedOut } = userModel;

const mockUser: UserResponseType = {
  id: 'u-1',
  email: 'alice@test.com',
  name: 'Alice',
  username: 'alice',
  image: null,
  gender: UserGenderEnum.FEMALE,
  dob: null,
  dod: null,
  description: null,
  deletedAt: null,
  createdAt: '2020-01-01',
  updatedAt: '2020-01-01',
};

describe('entities/user model (integration)', () => {
  afterEach(() => vi.restoreAllMocks());

  describe('$session', () => {
    it('starts as Initial', () => {
      const scope = fork();

      expect(scope.getState($session)).toBe(SessionStatus.Initial);
    });

    it('transitions to Authorized after a successful sessionFx', async () => {
      vi.spyOn(api.user, 'me').mockResolvedValue({
        data: mockUser,
      } as unknown as Awaited<ReturnType<typeof api.user.me>>);

      const scope = fork();

      await allSettled(sessionFx, { scope });

      expect(scope.getState($session)).toBe(SessionStatus.Authorized);
    });

    it('transitions to UnAuthorized after a failed sessionFx', async () => {
      vi.spyOn(api.user, 'me').mockRejectedValue(new Error('401'));
      const scope = fork();

      await allSettled(sessionFx, { scope });

      expect(scope.getState($session)).toBe(SessionStatus.UnAuthorized);
    });

    it('resets to UnAuthorized on loggedOut', async () => {
      vi.spyOn(api.auth, 'logout').mockResolvedValue(
        undefined as unknown as Awaited<ReturnType<typeof api.auth.logout>>,
      );

      const scope = fork({
        values: [[$session, SessionStatus.Authorized]],
      });

      await allSettled(loggedOut, { scope });

      expect(scope.getState($session)).toBe(SessionStatus.UnAuthorized);
    });
  });

  describe('$user', () => {
    it('starts as null', () => {
      const scope = fork();

      expect(scope.getState($user)).toBeNull();
    });

    it('is populated after a successful sessionFx', async () => {
      vi.spyOn(api.user, 'me').mockResolvedValue({
        data: mockUser,
      } as unknown as Awaited<ReturnType<typeof api.user.me>>);

      const scope = fork();

      await allSettled(sessionFx, { scope });

      expect(scope.getState($user)).toEqual(mockUser);
    });

    it('remains null after a failed sessionFx', async () => {
      vi.spyOn(api.user, 'me').mockRejectedValue(new Error('401'));

      const scope = fork();

      await allSettled(sessionFx, { scope });

      expect(scope.getState($user)).toBeNull();
    });

    it('loggedIn sets $user and marks session as Authorized', async () => {
      const scope = fork();

      await allSettled(loggedIn, { scope, params: mockUser });

      expect(scope.getState($user)).toEqual(mockUser);
      expect(scope.getState($session)).toBe(SessionStatus.Authorized);
    });

    it('loggedOut clears $user', async () => {
      vi.spyOn(api.auth, 'logout').mockResolvedValue(
        undefined as unknown as Awaited<ReturnType<typeof api.auth.logout>>,
      );

      const scope = fork({
        values: [
          [$session, SessionStatus.Authorized],
          [$user, mockUser],
        ],
      });

      await allSettled(loggedOut, { scope });

      expect(scope.getState($user)).toBeNull();
    });
  });
});
