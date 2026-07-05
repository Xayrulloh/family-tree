import { describe, expect, it } from 'vitest';
import { FCMTokenDeviceEnum } from '../schema';
import { FCMTokenResponseSchema } from './fcm-token.response';

const VALID = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  deletedAt: null,
  userId: '00000000-0000-4000-8000-000000000001',
  token: 'fcm-token-abc',
  deviceType: FCMTokenDeviceEnum.ANDROID,
};

describe('FCMTokenResponseSchema', () => {
  it('accepts a full FCM token object', () => {
    expect(FCMTokenResponseSchema.safeParse(VALID).success).toBe(true);
  });

  it('rejects a non-uuid userId', () => {
    expect(
      FCMTokenResponseSchema.safeParse({ ...VALID, userId: 'nope' }).success,
    ).toBe(false);
  });

  it('rejects a missing token', () => {
    const { token: _t, ...rest } = VALID;

    expect(FCMTokenResponseSchema.safeParse(rest).success).toBe(false);
  });
});
