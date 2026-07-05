import { describe, expect, it } from 'vitest';
import { UserGenderEnum, UserSchema } from './user.schema';

const VALID_BASE = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  deletedAt: null,
};

const VALID = {
  ...VALID_BASE,
  email: 'test@example.com',
  name: 'Test User',
  username: 'testUser',
  image: null,
  gender: UserGenderEnum.MALE,
  dob: null,
  dod: null,
  description: null,
};

describe('UserSchema', () => {
  it('accepts a valid user object', () => {
    expect(UserSchema.safeParse(VALID).success).toBe(true);
  });

  describe('email', () => {
    it('rejects an invalid email format', () => {
      expect(
        UserSchema.safeParse({ ...VALID, email: 'not-an-email' }).success,
      ).toBe(false);
    });

    it('rejects a missing email', () => {
      const { email: _e, ...rest } = VALID;

      expect(UserSchema.safeParse(rest).success).toBe(false);
    });
  });

  describe('name', () => {
    it('rejects a name shorter than 3 characters', () => {
      expect(UserSchema.safeParse({ ...VALID, name: 'Ab' }).success).toBe(
        false,
      );
    });

    it('accepts a name with exactly 3 characters', () => {
      expect(UserSchema.safeParse({ ...VALID, name: 'Abc' }).success).toBe(
        true,
      );
    });
  });

  describe('image', () => {
    it('accepts null', () => {
      expect(UserSchema.safeParse({ ...VALID, image: null }).success).toBe(
        true,
      );
    });

    it('rejects an image URL shorter than 10 characters', () => {
      expect(UserSchema.safeParse({ ...VALID, image: 'short' }).success).toBe(
        false,
      );
    });

    it('accepts a valid image URL', () => {
      expect(
        UserSchema.safeParse({
          ...VALID,
          image: 'https://example.com/avatar.png',
        }).success,
      ).toBe(true);
    });
  });

  describe('gender', () => {
    it('accepts MALE', () => {
      expect(
        UserSchema.safeParse({ ...VALID, gender: UserGenderEnum.MALE }).success,
      ).toBe(true);
    });

    it('accepts FEMALE', () => {
      expect(
        UserSchema.safeParse({ ...VALID, gender: UserGenderEnum.FEMALE })
          .success,
      ).toBe(true);
    });

    it('accepts UNKNOWN', () => {
      expect(
        UserSchema.safeParse({ ...VALID, gender: UserGenderEnum.UNKNOWN })
          .success,
      ).toBe(true);
    });

    it('rejects an unrecognized gender value', () => {
      expect(UserSchema.safeParse({ ...VALID, gender: 'OTHER' }).success).toBe(
        false,
      );
    });
  });

  describe('optional date fields', () => {
    it('accepts null for dob and dod', () => {
      expect(
        UserSchema.safeParse({ ...VALID, dob: null, dod: null }).success,
      ).toBe(true);
    });

    it('accepts a valid date string for dob', () => {
      expect(
        UserSchema.safeParse({ ...VALID, dob: '1990-05-20' }).success,
      ).toBe(true);
    });

    it('rejects an invalid date string for dob', () => {
      expect(
        UserSchema.safeParse({ ...VALID, dob: 'not-a-date' }).success,
      ).toBe(false);
    });
  });

  describe('username', () => {
    it('rejects a missing username — required field with no default', () => {
      const { username: _u, ...rest } = VALID;

      expect(UserSchema.safeParse(rest).success).toBe(false);
    });
  });

  describe('nullable fields', () => {
    it('accepts null for description', () => {
      expect(
        UserSchema.safeParse({ ...VALID, description: null }).success,
      ).toBe(true);
    });
  });
});
