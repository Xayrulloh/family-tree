import { describe, expect, it } from 'vitest';
import { UserGenderEnum } from '../schema';
import { UserResponseSchema } from './user.response';

const VALID = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  deletedAt: null,
  email: 'test@example.com',
  name: 'Test User',
  username: 'testUser',
  image: null,
  gender: UserGenderEnum.MALE,
  dob: null,
  dod: null,
  description: null,
};

describe('UserResponseSchema', () => {
  it('accepts a full user object', () => {
    expect(UserResponseSchema.safeParse(VALID).success).toBe(true);
  });

  it('rejects an invalid email', () => {
    expect(
      UserResponseSchema.safeParse({ ...VALID, email: 'nope' }).success,
    ).toBe(false);
  });

  it('rejects a missing username', () => {
    const { username: _u, ...rest } = VALID;

    expect(UserResponseSchema.safeParse(rest).success).toBe(false);
  });
});
