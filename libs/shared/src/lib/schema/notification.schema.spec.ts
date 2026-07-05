import { describe, expect, it } from 'vitest';
import { NotificationSchema } from './notification.schema';

const VALID_BASE = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  deletedAt: null,
};

const VALID = {
  ...VALID_BASE,
  content: 'You have a new family member',
  receiverUserId: '00000000-0000-4000-8000-000000000001',
  senderUserId: '00000000-0000-4000-8000-000000000002',
};

describe('NotificationSchema', () => {
  it('accepts a valid notification object', () => {
    expect(NotificationSchema.safeParse(VALID).success).toBe(true);
  });

  describe('content', () => {
    it('rejects content shorter than 5 characters', () => {
      expect(
        NotificationSchema.safeParse({ ...VALID, content: 'Hi' }).success,
      ).toBe(false);
    });

    it('accepts content with exactly 5 characters', () => {
      expect(
        NotificationSchema.safeParse({ ...VALID, content: 'Hello' }).success,
      ).toBe(true);
    });
  });

  describe('receiverUserId / senderUserId', () => {
    it('rejects a non-UUID receiverUserId', () => {
      expect(
        NotificationSchema.safeParse({ ...VALID, receiverUserId: 'not-a-uuid' })
          .success,
      ).toBe(false);
    });

    it('rejects a non-UUID senderUserId', () => {
      expect(
        NotificationSchema.safeParse({ ...VALID, senderUserId: 'not-a-uuid' })
          .success,
      ).toBe(false);
    });
  });
});
