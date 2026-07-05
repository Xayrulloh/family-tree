import { describe, expect, it } from 'vitest';
import {
  FamilyTreeCreateRequestSchema,
  FamilyTreePaginationAndSearchQuerySchema,
  FamilyTreeUpdateRequestSchema,
} from './family-tree.request';

const VALID_CREATE = {
  name: 'Smith Family',
  image: null,
  isPublic: false,
};

describe('FamilyTreeCreateRequestSchema', () => {
  it('accepts a valid create payload', () => {
    expect(FamilyTreeCreateRequestSchema.safeParse(VALID_CREATE).success).toBe(
      true,
    );
  });

  it('rejects a name shorter than 3 characters', () => {
    expect(
      FamilyTreeCreateRequestSchema.safeParse({ ...VALID_CREATE, name: 'Ab' })
        .success,
    ).toBe(false);
  });

  it('rejects a missing name', () => {
    const { name: _n, ...rest } = VALID_CREATE;

    expect(FamilyTreeCreateRequestSchema.safeParse(rest).success).toBe(false);
  });

  it('accepts an image url string', () => {
    expect(
      FamilyTreeCreateRequestSchema.safeParse({
        ...VALID_CREATE,
        image: 'https://cdn.example.com/tree.png',
      }).success,
    ).toBe(true);
  });

  it('strips ownership fields a client must not set (createdBy, id)', () => {
    const result = FamilyTreeCreateRequestSchema.parse({
      ...VALID_CREATE,
      createdBy: '00000000-0000-4000-8000-000000000001',
      id: '550e8400-e29b-41d4-a716-446655440000',
    });

    expect(result).not.toHaveProperty('createdBy');
    expect(result).not.toHaveProperty('id');
  });
});

describe('FamilyTreeUpdateRequestSchema', () => {
  it('accepts an empty object — all fields optional on update', () => {
    expect(FamilyTreeUpdateRequestSchema.safeParse({}).success).toBe(true);
  });

  it('accepts a partial update with only isPublic', () => {
    expect(
      FamilyTreeUpdateRequestSchema.safeParse({ isPublic: true }).success,
    ).toBe(true);
  });

  it('still validates provided fields — short name rejected', () => {
    expect(
      FamilyTreeUpdateRequestSchema.safeParse({ name: 'Ab' }).success,
    ).toBe(false);
  });
});

describe('FamilyTreePaginationAndSearchQuerySchema', () => {
  it('applies pagination defaults with an empty query', () => {
    const result = FamilyTreePaginationAndSearchQuerySchema.parse({});

    expect(result.page).toBe(1);
    expect(result.perPage).toBe(15);
  });

  it('accepts combined pagination, name, and isPublic filters', () => {
    const result = FamilyTreePaginationAndSearchQuerySchema.parse({
      page: '2',
      perPage: '10',
      name: 'Smith',
      isPublic: 'true',
    });

    expect(result).toEqual({
      page: 2,
      perPage: 10,
      name: 'Smith',
      isPublic: true,
    });
  });

  it('rejects a search name shorter than 3 characters', () => {
    expect(
      FamilyTreePaginationAndSearchQuerySchema.safeParse({ name: 'Ab' })
        .success,
    ).toBe(false);
  });
});
