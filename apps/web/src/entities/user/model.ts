import { UserResponseType } from '@family-tree/shared';
import {
  chainRoute,
  RouteInstance,
  RouteParams,
  RouteParamsAndQuery,
} from 'atomic-router';
import {
  createEffect,
  createEvent,
  createStore,
  EventCallable,
  merge,
  sample,
  split,
} from 'effector';
import { reshape } from 'patronum';
import { api } from '../../shared/api';
import { routes } from '../../shared/config/routing';

export enum SessionStatus {
  Initial,
  Pending,
  Authorized,
  UnAuthorized,
}

const loggedIn = createEvent<UserResponseType>();
const loggedOut = createEvent();

export const $session = createStore(SessionStatus.Initial);

export const sessionStatus = reshape({
  source: $session,
  shape: {
    $isInitial: (status) => status === SessionStatus.Initial,
    $isAuthorized: (status) => status === SessionStatus.Authorized,
    $isUnAuthorized: (status) => status === SessionStatus.UnAuthorized,
  },
});

export const $user = createStore<UserResponseType | null>(null);

export const sessionFx = createEffect(() => api.user.me());

const authorized = sessionFx.doneData;
const notAuthorized = sessionFx.failData;

$session.reset([loggedOut]);
$user.on(sessionFx.doneData, (_, response) => response.data).reset([loggedOut]);

sample({
  clock: sessionFx,
  filter: sessionStatus.$isInitial,
  fn: () => SessionStatus.Pending,
  target: $session,
});

sample({
  clock: authorized,
  fn: () => SessionStatus.Authorized,
  target: $session,
});

sample({
  clock: notAuthorized,
  fn: () => SessionStatus.UnAuthorized,
  target: $session,
});

sample({
  clock: loggedIn,
  target: $user,
});

sample({
  clock: loggedIn,
  fn: () => SessionStatus.Authorized,
  target: $session,
});

type ChainOptions<Params extends RouteParams> = {
  route: RouteInstance<Params>;
  otherwise?: EventCallable<void>;
};

export const chainAuthorized = <Params extends RouteParams>({
  route,
  otherwise,
}: ChainOptions<Params>) => {
  const authCheckStarted = createEvent<RouteParamsAndQuery<Params>>();
  const authCheckFailed = createEvent();

  const roleAndAuthCheckDone = createEvent();

  const { alreadyAuthorized, alreadyAnonymous } = split(
    sample({ clock: authCheckStarted, source: sessionStatus }),
    {
      alreadyAuthorized: (session) => session.$isAuthorized,
      alreadyAnonymous: (status) => status.$isUnAuthorized,
    }
  );

  const authCheckDone = merge([alreadyAuthorized, authorized]);

  sample({
    clock: authCheckDone,
    target: roleAndAuthCheckDone,
  });

  sample({
    clock: authCheckStarted,
    filter: sessionStatus.$isInitial,
    target: sessionFx,
  });

  sample({
    clock: [alreadyAnonymous, notAuthorized],
    filter: route.$isOpened,
    target: authCheckFailed,
  });

  if (otherwise) {
    sample({
      clock: authCheckFailed,
      target: otherwise,
    });
  } else {
    sample({
      clock: [alreadyAnonymous, notAuthorized],
      filter: route.$isOpened,
      target: routes.registration.open,
    });
  }

  return chainRoute({
    route,
    beforeOpen: authCheckStarted,
    openOn: roleAndAuthCheckDone,
    cancelOn: authCheckFailed,
  });
};

export const chainAnonymous = <Params extends RouteParams>({
  route,
  otherwise,
}: ChainOptions<Params>) => {
  const authCheckStarted = createEvent<RouteParamsAndQuery<Params>>();
  const authCheckDone = createEvent();

  const { alreadyAuthorized, alreadyAnonymous } = split(
    sample({ clock: authCheckStarted, source: sessionStatus }),
    {
      alreadyAuthorized: (session) => session.$isAuthorized,
      alreadyAnonymous: (status) => status.$isUnAuthorized,
    }
  );

  sample({
    clock: authCheckStarted,
    filter: sessionStatus.$isInitial,
    target: sessionFx,
  });

  sample({
    clock: [alreadyAuthorized, authorized],
    filter: route.$isOpened,
    target: authCheckDone,
  });

  if (otherwise) {
    sample({
      clock: authCheckDone,
      target: otherwise,
    });
  } else {
    sample({
      clock: [alreadyAuthorized, authorized],
      filter: route.$isOpened,
      target: routes.browse.open,
    });
  }

  return chainRoute({
    route,
    beforeOpen: authCheckStarted,
    openOn: [alreadyAnonymous, notAuthorized],
    cancelOn: authCheckDone,
  });
};

export default {
  $session,
  sessionStatus,
  sessionFx,
  chainAuthorized,
  chainAnonymous,
  loggedIn,
  loggedOut,
  $user,

  SessionStatus,
};
