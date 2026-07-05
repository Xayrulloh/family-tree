import type { RouteInstance, RouteParams } from 'atomic-router';
import { allSettled, type EventCallable, type Scope } from 'effector';

// atomic-router types `route.opened`/`closed` as derived `Event`s, but at
// runtime they are plain callable events (only a history router normally
// fires them). Tests must fire them directly, so unwrap the type here.
export function openRoute<Params extends RouteParams>(
  route: RouteInstance<Params>,
  scope: Scope,
  params: Params = {} as Params,
  query: Record<string, string> = {},
) {
  return allSettled(
    route.opened as EventCallable<{ params: Params; query: typeof query }>,
    { scope, params: { params, query } },
  );
}

export function closeRoute<Params extends RouteParams>(
  route: RouteInstance<Params>,
  scope: Scope,
) {
  return allSettled(route.closed as EventCallable<void>, { scope });
}
