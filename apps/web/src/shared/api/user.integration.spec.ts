import { describe, expect, it } from 'vitest';
import { recordRequest } from '~/test/request-recorder';
import { user } from './user';

describe('user api client (integration)', () => {
  it('me → GET /users/me', async () => {
    const rec = recordRequest();

    await user.me();

    expect(rec.method).toBe('GET');
    expect(rec.pathname).toBe('/users/me');
  });

  it('update → PUT /users with body', async () => {
    const rec = recordRequest();

    await user.update({ name: 'Alice' });

    expect(rec.method).toBe('PUT');
    expect(rec.pathname).toBe('/users');
    expect(rec.body).toEqual({ name: 'Alice' });
  });

  it('findById → GET /users/:id', async () => {
    const rec = recordRequest();

    await user.findById('user-123');

    expect(rec.method).toBe('GET');
    expect(rec.pathname).toBe('/users/user-123');
  });

  it('randomAvatar → PATCH /users/avatar', async () => {
    const rec = recordRequest();

    await user.randomAvatar();

    expect(rec.method).toBe('PATCH');
    expect(rec.pathname).toBe('/users/avatar');
  });
});
