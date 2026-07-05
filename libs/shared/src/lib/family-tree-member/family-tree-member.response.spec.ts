import { describe, expect, it } from 'vitest';
import { UserGenderEnum } from '../schema';
import {
  FamilyTreeMemberDeletePreviewSchema,
  FamilyTreeMemberGetAllResponseSchema,
  FamilyTreeMemberGetResponseSchema,
} from './family-tree-member.response';

const VALID_MEMBER = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  deletedAt: null,
  name: 'John Smith',
  image: null,
  gender: UserGenderEnum.MALE,
  dob: '1990-05-01',
  dod: null,
  description: null,
  familyTreeId: '00000000-0000-4000-8000-000000000001',
};

describe('FamilyTreeMemberGetResponseSchema', () => {
  it('accepts a full member object', () => {
    expect(
      FamilyTreeMemberGetResponseSchema.safeParse(VALID_MEMBER).success,
    ).toBe(true);
  });

  it('rejects a member missing familyTreeId', () => {
    const { familyTreeId: _f, ...rest } = VALID_MEMBER;

    expect(FamilyTreeMemberGetResponseSchema.safeParse(rest).success).toBe(
      false,
    );
  });
});

describe('FamilyTreeMemberGetAllResponseSchema', () => {
  it('accepts an array of members', () => {
    expect(
      FamilyTreeMemberGetAllResponseSchema.safeParse([VALID_MEMBER]).success,
    ).toBe(true);
  });

  it('accepts an empty array', () => {
    expect(FamilyTreeMemberGetAllResponseSchema.safeParse([]).success).toBe(
      true,
    );
  });

  it('rejects a bare object — response must be an array', () => {
    expect(
      FamilyTreeMemberGetAllResponseSchema.safeParse(VALID_MEMBER).success,
    ).toBe(false);
  });
});

describe('FamilyTreeMemberDeletePreviewSchema', () => {
  it('accepts a deletable preview', () => {
    expect(
      FamilyTreeMemberDeletePreviewSchema.safeParse({
        canDelete: true,
        blockReason: null,
        spouseToDelete: null,
      }).success,
    ).toBe(true);
  });

  it('accepts a blocked preview with a reason and a spouse to delete', () => {
    expect(
      FamilyTreeMemberDeletePreviewSchema.safeParse({
        canDelete: false,
        blockReason: 'Member has children',
        spouseToDelete: VALID_MEMBER,
      }).success,
    ).toBe(true);
  });

  it('rejects when canDelete is missing', () => {
    expect(
      FamilyTreeMemberDeletePreviewSchema.safeParse({
        blockReason: null,
        spouseToDelete: null,
      }).success,
    ).toBe(false);
  });
});
