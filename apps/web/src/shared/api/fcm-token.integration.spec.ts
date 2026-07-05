import { FCMTokenDeviceEnum } from '@family-tree/shared';
import { describe, expect, it } from 'vitest';
import { recordRequest } from '~/test/request-recorder';
import { fcmToken } from './fcm-token';

describe('fcmToken api client (integration)', () => {
  it('create → POST /fcm-tokens with body', async () => {
    const rec = recordRequest();

    await fcmToken.create({
      token: 'abc',
      deviceType: FCMTokenDeviceEnum.WEB,
    });

    expect(rec.method).toBe('POST');
    expect(rec.pathname).toBe('/fcm-tokens');
    expect(rec.body).toEqual({ token: 'abc', deviceType: 'WEB' });
  });

  it('delete → DELETE /fcm-tokens with body payload', async () => {
    const rec = recordRequest();

    await fcmToken.delete({
      token: 'abc',
      deviceType: FCMTokenDeviceEnum.ANDROID,
    });

    expect(rec.method).toBe('DELETE');
    expect(rec.pathname).toBe('/fcm-tokens');
    expect(rec.body).toEqual({ token: 'abc', deviceType: 'ANDROID' });
  });
});
