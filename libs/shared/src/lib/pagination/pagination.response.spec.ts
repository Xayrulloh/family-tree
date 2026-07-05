import { describe, expect, it } from 'vitest';
import { PaginationResponseSchema } from './pagination.response';

describe('PaginationResponseSchema', () => {
  it('accepts a full pagination object', () => {
    expect(
      PaginationResponseSchema.safeParse({
        page: 2,
        perPage: 15,
        totalCount: 31,
        totalPages: 3,
      }).success,
    ).toBe(true);
  });

  it('applies defaults for all fields when empty', () => {
    const result = PaginationResponseSchema.parse({});

    expect(result).toEqual({
      page: 1,
      perPage: 15,
      totalCount: 0,
      totalPages: 0,
    });
  });

  it('rejects non-numeric totalCount', () => {
    expect(
      PaginationResponseSchema.safeParse({ totalCount: 'lots' }).success,
    ).toBe(false);
  });
});
