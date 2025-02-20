import { HttpStatusCode } from 'axios';
import { createStore, createEvent, createEffect } from 'effector';
import { UserResponseType } from '@family-tree/shared'

// Events
const setUser = createEvent<UserResponseType | null>();
const resetUser = createEvent();

const fetchUserFx = createEffect<void, UserResponseType, Error>(async (): Promise<UserResponseType> => {
  const user = await fetch(`${import.meta.env.VITE_API_URL}/users/me`, {
    credentials: 'include'
  })

  if (user.status !== HttpStatusCode.Ok) {
    window.location.href = '/register';
  }

  return await user.json()
});

// Store
const $user = createStore<UserResponseType | null>(null)
  .on(setUser, (_, user) => user)
  .on(fetchUserFx.doneData, (_, user) => user)
  .reset(resetUser);

export { fetchUserFx, $user, setUser, resetUser };
