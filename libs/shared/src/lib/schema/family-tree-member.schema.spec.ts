import { describe, expect, it } from 'vitest';
import { FamilyTreeMemberSchema } from './family-tree-member.schema';
import { UserGenderEnum } from './user.schema';

const VALID_BASE = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  deletedAt: null,
};

const VALID = {
  ...VALID_BASE,
  name: 'John Doe',
  image: null,
  gender: UserGenderEnum.MALE,
  dob: null,
  dod: null,
  description: null,
  familyTreeId: '00000000-0000-4000-8000-000000000001',
};

describe('FamilyTreeMemberSchema', () => {
  it('accepts a valid member object', () => {
    expect(FamilyTreeMemberSchema.safeParse(VALID).success).toBe(true);
  });

  describe('name', () => {
    it('rejects a name shorter than 3 characters', () => {
      expect(
        FamilyTreeMemberSchema.safeParse({ ...VALID, name: 'Jo' }).success,
      ).toBe(false);
    });

    it('accepts a name with exactly 3 characters', () => {
      expect(
        FamilyTreeMemberSchema.safeParse({ ...VALID, name: 'Joe' }).success,
      ).toBe(true);
    });
  });

  describe('gender', () => {
    it('accepts MALE', () => {
      expect(
        FamilyTreeMemberSchema.safeParse({
          ...VALID,
          gender: UserGenderEnum.MALE,
        }).success,
      ).toBe(true);
    });

    it('accepts FEMALE', () => {
      expect(
        FamilyTreeMemberSchema.safeParse({
          ...VALID,
          gender: UserGenderEnum.FEMALE,
        }).success,
      ).toBe(true);
    });

    it('rejects UNKNOWN — members must have a known gender', () => {
      expect(
        FamilyTreeMemberSchema.safeParse({
          ...VALID,
          gender: UserGenderEnum.UNKNOWN,
        }).success,
      ).toBe(false);
    });

    it('rejects arbitrary gender strings', () => {
      expect(
        FamilyTreeMemberSchema.safeParse({ ...VALID, gender: 'OTHER' }).success,
      ).toBe(false);
    });
  });

  describe('familyTreeId', () => {
    it('rejects a non-UUID familyTreeId', () => {
      expect(
        FamilyTreeMemberSchema.safeParse({
          ...VALID,
          familyTreeId: 'not-a-uuid',
        }).success,
      ).toBe(false);
    });
  });

  describe('optional fields', () => {
    it('accepts null for image', () => {
      expect(
        FamilyTreeMemberSchema.safeParse({ ...VALID, image: null }).success,
      ).toBe(true);
    });

    it('accepts null for dob and dod', () => {
      expect(
        FamilyTreeMemberSchema.safeParse({ ...VALID, dob: null, dod: null })
          .success,
      ).toBe(true);
    });

    it('accepts a valid date string for dob', () => {
      expect(
        FamilyTreeMemberSchema.safeParse({ ...VALID, dob: '1990-01-01' })
          .success,
      ).toBe(true);
    });

    it('accepts null for description', () => {
      expect(
        FamilyTreeMemberSchema.safeParse({ ...VALID, description: null })
          .success,
      ).toBe(true);
    });
  });
});
