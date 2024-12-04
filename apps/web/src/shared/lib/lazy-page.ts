import { chainRoute, type RouteInstance, type RouteParams, type RouteParamsAndQuery } from 'atomic-router';
import { createEffect, createEvent, createStore, Event, sample } from 'effector';
import { and, condition, not } from 'patronum';
import { type ComponentProps, type ComponentType, createElement, lazy, memo } from 'react';

export type LazyPageProps<Model, Props extends object = object> = Props & { model: Model };

export type LazyPageFactoryParams<Params extends RouteParams = Record<string, unknown>> = {
  route: RouteInstance<Params>;
};

export const createLazyPage = <
  Params extends RouteParams,
  Model,
  Page extends ComponentType<{ model: Model }>,
  StaticDeps extends Record<string, unknown>,
>({
  route,
  load,
  staticDeps = {} as StaticDeps,
}: {
  route: RouteInstance<Params>;
  staticDeps?: StaticDeps;
  load: () => Promise<{
    createModel: (params: { route: RouteInstance<Params> } & StaticDeps) => Model | Promise<Model>;
    component: Page;
  }>;
}) => {
  const opened = createEvent<RouteParamsAndQuery<Params>>();
  const loaded = createEvent();

  const chainedRoute = chainRoute({
    route,
    beforeOpen: opened,
    openOn: loaded,
  });

  let model: Promise<Model> | undefined;

  const loadFx = createEffect(async () => {
    const { component, createModel } = await load();

    if (!model) {
      model = Promise.resolve(createModel({ route: chainedRoute, ...staticDeps }));
    }

    return {
      component,
      model: await model,
    };
  });

  const $isLoaded = createStore(false).on(loaded, () => true);

  condition({
    source: opened,
    if: $isLoaded,
    then: loaded,
    else: loadFx,
  });

  sample({
    clock: loadFx.doneData,
    filter: not($isLoaded),
    target: loaded,
  });

  return lazy(() =>
    loadFx().then(({ model, component }) => {
      const Component = memo((props: Omit<ComponentProps<Page>, 'model'>) => {
        return createElement(component, { model, ...props });
      });

      Component.displayName = `Lazy${Component.displayName ?? 'Page'}`;

      return { default: Component };
    }),
  );
};

export const chainModuleLoaded = <Params extends RouteParams>({
  route,
  load,
  triggerRouteOpening,
}: {
  route: RouteInstance<Params>;
  load: () => Promise<unknown>;
  triggerRouteOpening?: Event<void>;
}) => {
  const opened = createEvent<RouteParamsAndQuery<Params>>();
  const loaded = createEvent();
  const triggerOpening = triggerRouteOpening ?? createEvent();

  const loadFx = createEffect(load);

  const $isLoaded = createStore(false).on(loaded, () => true);
  const $isRouteOpeningTriggered = triggerRouteOpening
    ? createStore(false).on(triggerRouteOpening, () => true)
    : createStore(true);

  const startLoading = sample({
    clock: [triggerOpening, opened],
    filter: and($isRouteOpeningTriggered, route.$isOpened),
  });

  condition({
    source: startLoading,
    if: $isLoaded,
    then: loaded,
    else: loadFx,
  });

  sample({
    clock: loadFx.doneData,
    filter: not($isLoaded),
    target: loaded,
  });

  return chainRoute({
    route,
    beforeOpen: opened,
    openOn: loaded,
  });
};
