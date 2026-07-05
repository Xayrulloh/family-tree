import { describe, expect, it } from 'vitest';
import {
  FamilyTreeSharedCreateRequestSchema,
  FamilyTreeSharedIdParamSchema,
  FamilyTreeSharedPaginationAndSearchQuerySchema,
  FamilyTreeSharedUpdateParamSchema,
  FamilyTreeSharedUpdateRequestSchema,
} from './shared-family-tree.request';

const UUID = '550e8400-e29b-41d4-a716-446655440000';

describe('FamilyTreeSharedCreateRequestSchema', () => {
  it('accepts familyTreeId and userId', () => {
    expect(
      FamilyTreeSharedCreateRequestSchema.safeParse({
        familyTreeId: UUID,
        userId: UUID,
      }).success,
    ).toBe(true);
  });

  it('rejects when userId is missing', () => {
    expect(
      FamilyTreeSharedCreateRequestSchema.safeParse({ familyTreeId: UUID })
        .success,
    ).toBe(false);
  });

  it('strips permission flags — a share is created without RBAC input', () => {
    const result = FamilyTreeSharedCreateRequestSchema.parse({
      familyTreeId: UUID,
      userId: UUID,
      canAddMembers: true,
    });

    expect(result).not.toHaveProperty('canAddMembers');
  });
});

describe('FamilyTreeSharedIdParamSchema', () => {
  it('requires only familyTreeId', () => {
    expect(
      FamilyTreeSharedIdParamSchema.safeParse({ familyTreeId: UUID }).success,
    ).toBe(true);
    expect(FamilyTreeSharedIdParamSchema.safeParse({}).success).toBe(false);
  });
});

describe('FamilyTreeSharedUpdateRequestSchema', () => {
  it('requires all four RBAC flags', () => {
    expect(
      FamilyTreeSharedUpdateRequestSchema.safeParse({
        canAddMembers: true,
        canEditMembers: false,
        canDeleteMembers: false,
        isBlocked: false,
      }).success,
    ).toBe(true);
  });

  it('rejects a partial flag set', () => {
    expect(
      FamilyTreeSharedUpdateRequestSchema.safeParse({ canAddMembers: true })
        .success,
    ).toBe(false);
  });

  it('rejects non-boolean flag values', () => {
    expect(
      FamilyTreeSharedUpdateRequestSchema.safeParse({
        canAddMembers: 'yes',
        canEditMembers: false,
        canDeleteMembers: false,
        isBlocked: false,
      }).success,
    ).toBe(false);
  });
});

describe('FamilyTreeSharedUpdateParamSchema', () => {
  it('requires familyTreeId and userId, same as the create request', () => {
    expect(
      FamilyTreeSharedUpdateParamSchema.safeParse({
        familyTreeId: UUID,
        userId: UUID,
      }).success,
    ).toBe(true);

    expect(
      FamilyTreeSharedUpdateParamSchema.safeParse({ familyTreeId: UUID })
        .success,
    ).toBe(false);
  });
});

describe('FamilyTreeSharedPaginationAndSearchQuerySchema', () => {
  it('applies pagination defaults and accepts a name filter', () => {
    const result = FamilyTreeSharedPaginationAndSearchQuerySchema.parse({
      name: 'Smith',
    });

    expect(result).toEqual({ page: 1, perPage: 15, name: 'Smith' });
  });

  it('rejects a name shorter than 3 characters', () => {
    expect(
      FamilyTreeSharedPaginationAndSearchQuerySchema.safeParse({ name: 'Ab' })
        .success,
    ).toBe(false);
  });
});
