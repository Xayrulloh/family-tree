import { allSettled, fork } from 'effector';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { googleLoginFx } from './model';

describe('features/auth googleLoginFx', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('navigates the browser to the Google OAuth endpoint', async () => {
    const assign = vi.fn();

    vi.stubGlobal('location', { assign });

    const scope = fork();

    await allSettled(googleLoginFx, { scope });

    expect(assign).toHaveBeenCalledWith(
      `${import.meta.env.VITE_API_URL}/auth/google`,
    );
  });
});
