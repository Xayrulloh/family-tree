import { HttpStatusCode } from 'axios';
import { createEffect } from 'effector';

const usersMeFx = createEffect(async () => {
  const user = await fetch(`${import.meta.env.VITE_API_URL}/users/me`, {
    credentials: 'include'
  })

  if (user.status !== HttpStatusCode.Ok) {
    window.location.href = '/register';
  }

  const userData = await user.json()

  console.log(userData)
});

export { usersMeFx };
