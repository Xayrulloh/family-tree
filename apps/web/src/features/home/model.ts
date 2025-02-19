import { createEffect } from 'effector';

// Simulate Google login
const googleLoginFx = createEffect(async () => {
  return window.open(`${import.meta.env.VITE_API_URL}/auth/google`);
});

export { googleLoginFx };
