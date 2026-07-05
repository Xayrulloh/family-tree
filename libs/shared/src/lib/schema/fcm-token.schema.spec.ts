import { describe, expect, it } from 'vitest';
import { FCMTokenDeviceEnum, FCMTokenSchema } from './fcm-token.schema';

const VALID_BASE = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  deletedAt: null,
};

const VALID = {
  ...VALID_BASE,
  userId: '00000000-0000-4000-8000-000000000001',
  token: 'fcm-token-abc123',
  deviceType: FCMTokenDeviceEnum.WEB,
};

describe('FCMTokenSchema', () => {
  it('accepts a valid FCM token object', () => {
    expect(FCMTokenSchema.safeParse(VALID).success).toBe(true);
  });

  describe('deviceType', () => {
    it('accepts ANDROID', () => {
      expect(
        FCMTokenSchema.safeParse({
          ...VALID,
          deviceType: FCMTokenDeviceEnum.ANDROID,
        }).success,
      ).toBe(true);
    });

    it('accepts IOS', () => {
      expect(
        FCMTokenSchema.safeParse({
          ...VALID,
          deviceType: FCMTokenDeviceEnum.IOS,
        }).success,
      ).toBe(true);
    });

    it('accepts WEB', () => {
      expect(
        FCMTokenSchema.safeParse({
          ...VALID,
          deviceType: FCMTokenDeviceEnum.WEB,
        }).success,
      ).toBe(true);
    });

    it('rejects an unrecognized device type', () => {
      expect(
        FCMTokenSchema.safeParse({ ...VALID, deviceType: 'DESKTOP' }).success,
      ).toBe(false);
    });
  });

  describe('token', () => {
    it('rejects an empty token', () => {
      expect(FCMTokenSchema.safeParse({ ...VALID, token: '' }).success).toBe(
        false,
      );
    });
  });

  describe('userId', () => {
    it('rejects a non-UUID userId', () => {
      expect(
        FCMTokenSchema.safeParse({ ...VALID, userId: 'not-a-uuid' }).success,
      ).toBe(false);
    });
  });
});
