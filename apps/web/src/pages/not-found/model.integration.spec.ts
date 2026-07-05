import { createRoute } from 'atomic-router';
import { createWatch, fork } from 'effector';
import { describe, expect, it, vi } from 'vitest';
import { $session, SessionStatus } from '~/entities/user/model';
import { routes } from '~/shared/config/routing';
import { openRoute } from '~/test/route-events';

import { factory } from './model';

describe('pages/not-found factory (integration)', () => {
  it('redirects an already-authorized user to the trees page', async () => {
    const route = createRoute();

    factory({ route });

    const scope = fork({ values: [[$session, SessionStatus.Authorized]] });
    const treesOpened = vi.fn();

    createWatch({ unit: routes.trees.open, fn: treesOpened, scope });

    await openRoute(route, scope);

    expect(treesOpened).toHaveBeenCalled();
  });

  it('keeps an anonymous user on the not-found page', async () => {
    const route = createRoute();

    factory({ route });

    const scope = fork({ values: [[$session, SessionStatus.UnAuthorized]] });

    const treesOpened = vi.fn();

    createWatch({ unit: routes.trees.open, fn: treesOpened, scope });

    await openRoute(route, scope);

    expect(treesOpened).not.toHaveBeenCalled();
  });
});
