import { createEffect } from 'effector';

// Simulate Google login
const googleLoginFx = createEffect(async () => {
  return (window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`);
});

export { googleLoginFx };
