import { describe, expect, it } from 'vitest';
import { FamilyTreeSchema } from './family-tree.schema';

const VALID_BASE = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  deletedAt: null,
};

const VALID = {
  ...VALID_BASE,
  createdBy: '00000000-0000-4000-8000-000000000001',
  name: 'Smith Family',
  image: null,
  isPublic: false,
};

describe('FamilyTreeSchema', () => {
  it('accepts a valid family tree object', () => {
    expect(FamilyTreeSchema.safeParse(VALID).success).toBe(true);
  });

  describe('name', () => {
    it('rejects a name shorter than 3 characters', () => {
      expect(FamilyTreeSchema.safeParse({ ...VALID, name: 'Ab' }).success).toBe(
        false,
      );
    });

    it('accepts a name with exactly 3 characters', () => {
      expect(
        FamilyTreeSchema.safeParse({ ...VALID, name: 'Abc' }).success,
      ).toBe(true);
    });

    it('rejects a name longer than 20 characters', () => {
      expect(
        FamilyTreeSchema.safeParse({ ...VALID, name: 'A'.repeat(21) }).success,
      ).toBe(false);
    });

    it('accepts a name with exactly 20 characters', () => {
      expect(
        FamilyTreeSchema.safeParse({ ...VALID, name: 'A'.repeat(20) }).success,
      ).toBe(true);
    });
  });

  describe('isPublic', () => {
    it('defaults to false when omitted', () => {
      const { isPublic: _ip, ...rest } = VALID;
      const result = FamilyTreeSchema.safeParse(rest);

      expect(result.success).toBe(true);
      if (result.success) expect(result.data.isPublic).toBe(false);
    });

    it('accepts true', () => {
      expect(
        FamilyTreeSchema.safeParse({ ...VALID, isPublic: true }).success,
      ).toBe(true);
    });
  });

  describe('image', () => {
    it('accepts null', () => {
      expect(
        FamilyTreeSchema.safeParse({ ...VALID, image: null }).success,
      ).toBe(true);
    });

    it('accepts a URL string', () => {
      expect(
        FamilyTreeSchema.safeParse({
          ...VALID,
          image: 'https://example.com/tree.png',
        }).success,
      ).toBe(true);
    });
  });

  describe('createdBy', () => {
    it('rejects an empty string', () => {
      expect(
        FamilyTreeSchema.safeParse({ ...VALID, createdBy: '' }).success,
      ).toBe(false);
    });
  });
});
