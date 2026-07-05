import { describe, expect, it } from 'vitest';
import { UserGenderEnum } from '../schema';
import {
  FamilyTreeMemberCreateChildRequestSchema,
  FamilyTreeMemberCreateParentsRequestSchema,
  FamilyTreeMemberCreateSpouseRequestSchema,
  FamilyTreeMemberGetAllParamSchema,
  FamilyTreeMemberGetParamSchema,
  FamilyTreeMemberUpdateRequestSchema,
} from './family-tree-member.request';

const UUID = '550e8400-e29b-41d4-a716-446655440000';

describe('FamilyTreeMemberCreateChildRequestSchema', () => {
  it('accepts gender plus fromMemberId', () => {
    expect(
      FamilyTreeMemberCreateChildRequestSchema.safeParse({
        gender: UserGenderEnum.MALE,
        fromMemberId: UUID,
      }).success,
    ).toBe(true);
  });

  it('rejects an invalid gender value', () => {
    expect(
      FamilyTreeMemberCreateChildRequestSchema.safeParse({
        gender: 'OTHER',
        fromMemberId: UUID,
      }).success,
    ).toBe(false);
  });

  it('rejects a missing fromMemberId', () => {
    expect(
      FamilyTreeMemberCreateChildRequestSchema.safeParse({
        gender: UserGenderEnum.FEMALE,
      }).success,
    ).toBe(false);
  });
});

describe('FamilyTreeMemberCreateSpouseRequestSchema', () => {
  it('accepts a valid fromMemberId', () => {
    expect(
      FamilyTreeMemberCreateSpouseRequestSchema.safeParse({
        fromMemberId: UUID,
      }).success,
    ).toBe(true);
  });

  it('rejects a non-uuid fromMemberId', () => {
    expect(
      FamilyTreeMemberCreateSpouseRequestSchema.safeParse({
        fromMemberId: 'nope',
      }).success,
    ).toBe(false);
  });

  it('parents create schema requires the same fromMemberId shape', () => {
    expect(
      FamilyTreeMemberCreateParentsRequestSchema.safeParse({
        fromMemberId: UUID,
      }).success,
    ).toBe(true);

    expect(
      FamilyTreeMemberCreateParentsRequestSchema.safeParse({}).success,
    ).toBe(false);
  });
});

describe('FamilyTreeMemberUpdateRequestSchema', () => {
  it('accepts an empty object — all fields optional on update', () => {
    expect(FamilyTreeMemberUpdateRequestSchema.safeParse({}).success).toBe(
      true,
    );
  });

  it('accepts a partial update of name and dob', () => {
    expect(
      FamilyTreeMemberUpdateRequestSchema.safeParse({
        name: 'John Smith',
        dob: '1990-05-01',
      }).success,
    ).toBe(true);
  });

  it('still validates provided fields — short name rejected', () => {
    expect(
      FamilyTreeMemberUpdateRequestSchema.safeParse({ name: 'Ab' }).success,
    ).toBe(false);
  });

  it('strips immutable fields (id, familyTreeId)', () => {
    const result = FamilyTreeMemberUpdateRequestSchema.parse({
      id: UUID,
      familyTreeId: UUID,
      name: 'John Smith',
    });

    expect(result).toEqual({ name: 'John Smith' });
  });
});

describe('FamilyTreeMemberGetParamSchema', () => {
  it('requires both id and familyTreeId', () => {
    expect(
      FamilyTreeMemberGetParamSchema.safeParse({
        id: UUID,
        familyTreeId: UUID,
      }).success,
    ).toBe(true);
    expect(FamilyTreeMemberGetParamSchema.safeParse({ id: UUID }).success).toBe(
      false,
    );
  });
});

describe('FamilyTreeMemberGetAllParamSchema', () => {
  it('requires only familyTreeId', () => {
    expect(
      FamilyTreeMemberGetAllParamSchema.safeParse({ familyTreeId: UUID })
        .success,
    ).toBe(true);
    expect(FamilyTreeMemberGetAllParamSchema.safeParse({}).success).toBe(false);
  });
});
