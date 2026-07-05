import { describe, expect, it } from 'vitest';
import { UserGenderEnum } from '../schema';
import {
  FamilyTreeSharedPaginationResponseSchema,
  FamilyTreeSharedResponseSchema,
  FamilyTreeSharedUserResponseSchema,
  FamilyTreeSharedUsersPaginationResponseSchema,
} from './shared-family-tree.response';

const BASE = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  deletedAt: null,
};

const RBAC = {
  familyTreeId: '00000000-0000-4000-8000-000000000001',
  userId: '00000000-0000-4000-8000-000000000002',
  canAddMembers: true,
  canEditMembers: false,
  canDeleteMembers: false,
  isBlocked: false,
};

// FamilyTreeSchema omit(id, isPublic) + RBAC pick
const VALID_SHARED_TREE = {
  ...BASE,
  createdBy: '00000000-0000-4000-8000-000000000003',
  name: 'Smith Family',
  image: null,
  ...RBAC,
};

// UserSchema omit(id, username) + RBAC pick
const VALID_SHARED_USER = {
  ...BASE,
  email: 'user@example.com',
  name: 'Test User',
  image: null,
  gender: UserGenderEnum.FEMALE,
  dob: null,
  dod: null,
  description: null,
  ...RBAC,
};

describe('FamilyTreeSharedResponseSchema', () => {
  it('accepts a tree merged with RBAC flags', () => {
    expect(
      FamilyTreeSharedResponseSchema.safeParse(VALID_SHARED_TREE).success,
    ).toBe(true);
  });

  it('rejects when an RBAC flag is missing', () => {
    const { isBlocked: _b, ...rest } = VALID_SHARED_TREE;

    expect(FamilyTreeSharedResponseSchema.safeParse(rest).success).toBe(false);
  });

  it('strips the omitted tree id and isPublic fields', () => {
    const result = FamilyTreeSharedResponseSchema.parse(VALID_SHARED_TREE);

    expect(result).not.toHaveProperty('id');
    expect(result).not.toHaveProperty('isPublic');
  });
});

describe('FamilyTreeSharedPaginationResponseSchema', () => {
  it('accepts pagination metadata plus sharedFamilyTrees array', () => {
    expect(
      FamilyTreeSharedPaginationResponseSchema.safeParse({
        page: 1,
        perPage: 15,
        totalCount: 1,
        totalPages: 1,
        sharedFamilyTrees: [VALID_SHARED_TREE],
      }).success,
    ).toBe(true);
  });

  it('rejects when sharedFamilyTrees is missing', () => {
    expect(FamilyTreeSharedPaginationResponseSchema.safeParse({}).success).toBe(
      false,
    );
  });
});

describe('FamilyTreeSharedUserResponseSchema', () => {
  it('accepts a user merged with RBAC flags', () => {
    expect(
      FamilyTreeSharedUserResponseSchema.safeParse(VALID_SHARED_USER).success,
    ).toBe(true);
  });

  it('rejects an invalid email', () => {
    expect(
      FamilyTreeSharedUserResponseSchema.safeParse({
        ...VALID_SHARED_USER,
        email: 'nope',
      }).success,
    ).toBe(false);
  });
});

describe('FamilyTreeSharedUsersPaginationResponseSchema', () => {
  it('accepts pagination metadata plus sharedFamilyTreeUsers array', () => {
    expect(
      FamilyTreeSharedUsersPaginationResponseSchema.safeParse({
        page: 1,
        perPage: 15,
        totalCount: 1,
        totalPages: 1,
        sharedFamilyTreeUsers: [VALID_SHARED_USER],
      }).success,
    ).toBe(true);
  });

  it('accepts an empty user list', () => {
    expect(
      FamilyTreeSharedUsersPaginationResponseSchema.safeParse({
        sharedFamilyTreeUsers: [],
      }).success,
    ).toBe(true);
  });
});
