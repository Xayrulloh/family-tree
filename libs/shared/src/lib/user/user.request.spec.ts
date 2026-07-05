import { describe, expect, it } from 'vitest';
import { UserGenderEnum } from '../schema';
import {
  UserEmailParamSchema,
  UserIdParamSchema,
  UserUpdateRequestSchema,
} from './user.request';

describe('UserUpdateRequestSchema', () => {
  it('accepts an empty object — all fields optional on update', () => {
    expect(UserUpdateRequestSchema.safeParse({}).success).toBe(true);
  });

  it('accepts a partial profile update', () => {
    expect(
      UserUpdateRequestSchema.safeParse({
        name: 'New Name',
        gender: UserGenderEnum.FEMALE,
        dob: '1990-05-01',
      }).success,
    ).toBe(true);
  });

  it('still validates provided fields — invalid gender rejected', () => {
    expect(UserUpdateRequestSchema.safeParse({ gender: 'OTHER' }).success).toBe(
      false,
    );
  });

  it('strips immutable identity fields (email, id)', () => {
    const result = UserUpdateRequestSchema.parse({
      email: 'other@example.com',
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'New Name',
    });

    expect(result).toEqual({ name: 'New Name' });
  });
});

describe('UserEmailParamSchema', () => {
  it('accepts a valid email', () => {
    expect(UserEmailParamSchema.safeParse({ email: 'a@b.co' }).success).toBe(
      true,
    );
  });

  it('rejects an invalid email', () => {
    expect(UserEmailParamSchema.safeParse({ email: 'nope' }).success).toBe(
      false,
    );
  });
});

describe('UserIdParamSchema', () => {
  it('accepts a valid uuid id', () => {
    expect(
      UserIdParamSchema.safeParse({
        id: '550e8400-e29b-41d4-a716-446655440000',
      }).success,
    ).toBe(true);
  });

  it('rejects a non-uuid id', () => {
    expect(UserIdParamSchema.safeParse({ id: '123' }).success).toBe(false);
  });
});
