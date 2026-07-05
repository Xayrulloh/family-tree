import { describe, expect, it } from 'vitest';
import { recordRequest } from '~/test/request-recorder';
import { notification } from './notification';

describe('notification api client (integration)', () => {
  it('findAll → GET /notifications', async () => {
    const rec = recordRequest();

    await notification.findAll();

    expect(rec.method).toBe('GET');
    expect(rec.pathname).toBe('/notifications');
  });

  it('read → GET /notifications/read', async () => {
    const rec = recordRequest();

    await notification.read();

    expect(rec.method).toBe('GET');
    expect(rec.pathname).toBe('/notifications/read');
  });
});
