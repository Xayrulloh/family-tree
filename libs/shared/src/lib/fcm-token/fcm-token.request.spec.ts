import { describe, expect, it } from 'vitest';
import { FCMTokenDeviceEnum } from '../schema';
import { FCMTokenCreateDeleteRequestSchema } from './fcm-token.request';

describe('FCMTokenCreateDeleteRequestSchema', () => {
  it.each([
    FCMTokenDeviceEnum.ANDROID,
    FCMTokenDeviceEnum.IOS,
    FCMTokenDeviceEnum.WEB,
  ])('accepts deviceType %s', (deviceType) => {
    expect(
      FCMTokenCreateDeleteRequestSchema.safeParse({
        token: 'fcm-token-abc',
        deviceType,
      }).success,
    ).toBe(true);
  });

  it('rejects an unknown deviceType', () => {
    expect(
      FCMTokenCreateDeleteRequestSchema.safeParse({
        token: 'fcm-token-abc',
        deviceType: 'DESKTOP',
      }).success,
    ).toBe(false);
  });

  it('rejects an empty token', () => {
    expect(
      FCMTokenCreateDeleteRequestSchema.safeParse({
        token: '',
        deviceType: FCMTokenDeviceEnum.WEB,
      }).success,
    ).toBe(false);
  });

  it('strips the server-side userId field', () => {
    const result = FCMTokenCreateDeleteRequestSchema.parse({
      token: 'fcm-token-abc',
      deviceType: FCMTokenDeviceEnum.WEB,
      userId: '550e8400-e29b-41d4-a716-446655440000',
    });

    expect(result).not.toHaveProperty('userId');
  });
});
