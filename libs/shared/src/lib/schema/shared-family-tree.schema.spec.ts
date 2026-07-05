import { describe, expect, it } from 'vitest';
import { FamilyTreeSharedSchema } from './shared-family-tree.schema';

const VALID_BASE = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  deletedAt: null,
};

const VALID = {
  ...VALID_BASE,
  familyTreeId: '00000000-0000-4000-8000-000000000001',
  userId: '00000000-0000-4000-8000-000000000003',
  isBlocked: false,
  canEditMembers: false,
  canDeleteMembers: false,
  canAddMembers: false,
};

describe('FamilyTreeSharedSchema', () => {
  it('accepts a valid shared record with all permissions false', () => {
    expect(FamilyTreeSharedSchema.safeParse(VALID).success).toBe(true);
  });

  it('accepts a record with all permissions true', () => {
    expect(
      FamilyTreeSharedSchema.safeParse({
        ...VALID,
        canEditMembers: true,
        canDeleteMembers: true,
        canAddMembers: true,
      }).success,
    ).toBe(true);
  });

  it('accepts isBlocked: true', () => {
    expect(
      FamilyTreeSharedSchema.safeParse({ ...VALID, isBlocked: true }).success,
    ).toBe(true);
  });

  describe('required boolean fields', () => {
    it('rejects a missing isBlocked', () => {
      const { isBlocked: _b, ...rest } = VALID;

      expect(FamilyTreeSharedSchema.safeParse(rest).success).toBe(false);
    });

    it('rejects a missing canAddMembers', () => {
      const { canAddMembers: _c, ...rest } = VALID;

      expect(FamilyTreeSharedSchema.safeParse(rest).success).toBe(false);
    });

    it('rejects a missing canEditMembers', () => {
      const { canEditMembers: _c, ...rest } = VALID;

      expect(FamilyTreeSharedSchema.safeParse(rest).success).toBe(false);
    });

    it('rejects a missing canDeleteMembers', () => {
      const { canDeleteMembers: _c, ...rest } = VALID;

      expect(FamilyTreeSharedSchema.safeParse(rest).success).toBe(false);
    });
  });
});
