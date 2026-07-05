import { describe, expect, it } from 'vitest';
import { NotificationResponseSchema } from './notification.response';

const VALID_NOTIFICATION = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  deletedAt: null,
  content: 'Your tree was shared with you',
  receiverUserId: '00000000-0000-4000-8000-000000000001',
  senderUserId: '00000000-0000-4000-8000-000000000002',
};

describe('NotificationResponseSchema', () => {
  it('accepts unread and last-5 notification lists', () => {
    expect(
      NotificationResponseSchema.safeParse({
        unReadNotifications: [VALID_NOTIFICATION],
        last5Notifications: [VALID_NOTIFICATION],
      }).success,
    ).toBe(true);
  });

  it('accepts empty lists', () => {
    expect(
      NotificationResponseSchema.safeParse({
        unReadNotifications: [],
        last5Notifications: [],
      }).success,
    ).toBe(true);
  });

  it('rejects when either list is missing', () => {
    expect(
      NotificationResponseSchema.safeParse({ unReadNotifications: [] }).success,
    ).toBe(false);
  });
});
