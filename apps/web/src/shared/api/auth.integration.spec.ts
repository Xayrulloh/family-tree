import { describe, expect, it } from 'vitest';
import { recordRequest } from '~/test/request-recorder';
import { auth } from './auth';

describe('auth api client (integration)', () => {
  it('googleAuth → GET /auth/google', async () => {
    const rec = recordRequest();

    await auth.googleAuth();

    expect(rec.method).toBe('GET');
    expect(rec.pathname).toBe('/auth/google');
  });

  it('logout → GET /auth/logout', async () => {
    const rec = recordRequest();

    await auth.logout();

    expect(rec.method).toBe('GET');
    expect(rec.pathname).toBe('/auth/logout');
  });
});
