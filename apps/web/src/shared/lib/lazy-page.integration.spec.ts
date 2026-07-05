import { createRoute } from 'atomic-router';
import { allSettled, createEvent, fork } from 'effector';
import { describe, expect, it, vi } from 'vitest';
import { closeRoute, openRoute } from '~/test/route-events';
import { chainModuleLoaded } from './lazy-page';

describe('chainModuleLoaded', () => {
  it('loads the module when the route opens', async () => {
    const route = createRoute();
    const load = vi.fn().mockResolvedValue({});

    chainModuleLoaded({ route, load });

    const scope = fork();

    await openRoute(route, scope);

    expect(load).toHaveBeenCalledTimes(1);
  });

  it('does not reload the module on a second open', async () => {
    const route = createRoute();
    const load = vi.fn().mockResolvedValue({});

    chainModuleLoaded({ route, load });

    const scope = fork();

    await openRoute(route, scope);
    await closeRoute(route, scope);
    await openRoute(route, scope);

    expect(load).toHaveBeenCalledTimes(1);
  });

  it('waits for triggerRouteOpening before loading', async () => {
    const route = createRoute();
    const load = vi.fn().mockResolvedValue({});
    const triggerRouteOpening = createEvent();

    chainModuleLoaded({ route, load, triggerRouteOpening });

    const scope = fork();

    await openRoute(route, scope);

    expect(load).not.toHaveBeenCalled();

    await allSettled(triggerRouteOpening, { scope });

    expect(load).toHaveBeenCalledTimes(1);
  });
});
