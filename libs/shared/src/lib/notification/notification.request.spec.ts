import { describe, expect, it } from 'vitest';
import { NotificationCreateRequestSchema } from './notification.request';

const VALID = {
  content: 'Your tree was shared with you',
  receiverUserId: '550e8400-e29b-41d4-a716-446655440000',
  senderUserId: '00000000-0000-4000-8000-000000000001',
};

describe('NotificationCreateRequestSchema', () => {
  it('accepts a valid create payload', () => {
    expect(NotificationCreateRequestSchema.safeParse(VALID).success).toBe(true);
  });

  it('rejects content shorter than 5 characters', () => {
    expect(
      NotificationCreateRequestSchema.safeParse({ ...VALID, content: 'Hey' })
        .success,
    ).toBe(false);
  });

  it('rejects a non-uuid receiverUserId', () => {
    expect(
      NotificationCreateRequestSchema.safeParse({
        ...VALID,
        receiverUserId: 'nope',
      }).success,
    ).toBe(false);
  });

  it('rejects a missing senderUserId', () => {
    const { senderUserId: _s, ...rest } = VALID;

    expect(NotificationCreateRequestSchema.safeParse(rest).success).toBe(false);
  });
});
