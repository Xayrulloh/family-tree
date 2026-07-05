import { describe, expect, it } from 'vitest';
import {
  FamilyTreeMemberConnectionGetAllParamSchema,
  FamilyTreeMemberConnectionGetByMemberParamSchema,
  FamilyTreeMemberConnectionGetParamSchema,
} from './family-tree-member-connection.request';

const UUID = '550e8400-e29b-41d4-a716-446655440000';

describe('FamilyTreeMemberConnectionGetParamSchema', () => {
  it('requires familyTreeId and id, both uuids', () => {
    expect(
      FamilyTreeMemberConnectionGetParamSchema.safeParse({
        familyTreeId: UUID,
        id: UUID,
      }).success,
    ).toBe(true);
  });

  it('rejects a non-uuid familyTreeId', () => {
    expect(
      FamilyTreeMemberConnectionGetParamSchema.safeParse({
        familyTreeId: 'nope',
        id: UUID,
      }).success,
    ).toBe(false);
  });

  it('rejects when id is missing', () => {
    expect(
      FamilyTreeMemberConnectionGetParamSchema.safeParse({
        familyTreeId: UUID,
      }).success,
    ).toBe(false);
  });
});

describe('FamilyTreeMemberConnectionGetAllParamSchema', () => {
  it('requires only familyTreeId', () => {
    expect(
      FamilyTreeMemberConnectionGetAllParamSchema.safeParse({
        familyTreeId: UUID,
      }).success,
    ).toBe(true);
    expect(
      FamilyTreeMemberConnectionGetAllParamSchema.safeParse({}).success,
    ).toBe(false);
  });
});

describe('FamilyTreeMemberConnectionGetByMemberParamSchema', () => {
  it('requires familyTreeId and memberUserId', () => {
    expect(
      FamilyTreeMemberConnectionGetByMemberParamSchema.safeParse({
        familyTreeId: UUID,
        memberUserId: UUID,
      }).success,
    ).toBe(true);
  });

  it('rejects a non-uuid memberUserId', () => {
    expect(
      FamilyTreeMemberConnectionGetByMemberParamSchema.safeParse({
        familyTreeId: UUID,
        memberUserId: 'nope',
      }).success,
    ).toBe(false);
  });
});
