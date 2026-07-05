import { describe, expect, it } from 'vitest';
import { FamilyTreeMemberConnectionEnum } from '../schema';
import {
  FamilyTreeMemberConnectionGetAllResponseSchema,
  FamilyTreeMemberConnectionGetResponseSchema,
} from './family-tree-member-connection.response';

const VALID_CONNECTION = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  deletedAt: null,
  fromMemberId: '00000000-0000-4000-8000-000000000001',
  toMemberId: '00000000-0000-4000-8000-000000000002',
  type: FamilyTreeMemberConnectionEnum.SPOUSE,
};

describe('FamilyTreeMemberConnectionGetResponseSchema', () => {
  it('accepts a valid SPOUSE connection', () => {
    expect(
      FamilyTreeMemberConnectionGetResponseSchema.safeParse(VALID_CONNECTION)
        .success,
    ).toBe(true);
  });

  it('accepts a valid PARENT connection', () => {
    expect(
      FamilyTreeMemberConnectionGetResponseSchema.safeParse({
        ...VALID_CONNECTION,
        type: FamilyTreeMemberConnectionEnum.PARENT,
      }).success,
    ).toBe(true);
  });

  it('rejects an unknown connection type', () => {
    expect(
      FamilyTreeMemberConnectionGetResponseSchema.safeParse({
        ...VALID_CONNECTION,
        type: 'SIBLING',
      }).success,
    ).toBe(false);
  });
});

describe('FamilyTreeMemberConnectionGetAllResponseSchema', () => {
  it('accepts an array of connections', () => {
    expect(
      FamilyTreeMemberConnectionGetAllResponseSchema.safeParse([
        VALID_CONNECTION,
      ]).success,
    ).toBe(true);
  });

  it('accepts an empty array', () => {
    expect(
      FamilyTreeMemberConnectionGetAllResponseSchema.safeParse([]).success,
    ).toBe(true);
  });
});
