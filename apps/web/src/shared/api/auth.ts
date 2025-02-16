import { base } from './base';

export const auth = {
  googleAuth: () => {
    return base.get('/api/auth/google');
  },
};
