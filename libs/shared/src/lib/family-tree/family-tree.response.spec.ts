import { describe, expect, it } from 'vitest';
import {
  FamilyTreePaginationResponseSchema,
  FamilyTreePreviewResponseSchema,
  FamilyTreeResponseSchema,
} from './family-tree.response';

const VALID_TREE = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  deletedAt: null,
  createdBy: '00000000-0000-4000-8000-000000000001',
  name: 'Smith Family',
  image: null,
  isPublic: false,
};

describe('FamilyTreeResponseSchema', () => {
  it('accepts a full family tree object', () => {
    expect(FamilyTreeResponseSchema.safeParse(VALID_TREE).success).toBe(true);
  });

  it('rejects an object missing createdBy', () => {
    const { createdBy: _c, ...rest } = VALID_TREE;

    expect(FamilyTreeResponseSchema.safeParse(rest).success).toBe(false);
  });
});

describe('FamilyTreePaginationResponseSchema', () => {
  it('accepts pagination metadata plus a familyTrees array', () => {
    expect(
      FamilyTreePaginationResponseSchema.safeParse({
        page: 1,
        perPage: 15,
        totalCount: 1,
        totalPages: 1,
        familyTrees: [VALID_TREE],
      }).success,
    ).toBe(true);
  });

  it('accepts an empty familyTrees array', () => {
    expect(
      FamilyTreePaginationResponseSchema.safeParse({ familyTrees: [] }).success,
    ).toBe(true);
  });

  it('rejects when familyTrees is missing', () => {
    expect(FamilyTreePaginationResponseSchema.safeParse({}).success).toBe(
      false,
    );
  });

  it('rejects when an entry in familyTrees is invalid', () => {
    expect(
      FamilyTreePaginationResponseSchema.safeParse({
        familyTrees: [{ ...VALID_TREE, name: 'Ab' }],
      }).success,
    ).toBe(false);
  });
});

describe('FamilyTreePreviewResponseSchema', () => {
  it('accepts only name and image', () => {
    expect(
      FamilyTreePreviewResponseSchema.safeParse({
        name: 'Smith Family',
        image: null,
      }).success,
    ).toBe(true);
  });

  it('strips all other tree fields', () => {
    const result = FamilyTreePreviewResponseSchema.parse(VALID_TREE);

    expect(result).toEqual({ name: 'Smith Family', image: null });
  });
});
