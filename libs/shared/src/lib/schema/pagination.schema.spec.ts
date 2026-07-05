import { describe, expect, it } from 'vitest';
import { PaginationSchema } from './pagination.schema';

describe('PaginationSchema', () => {
  it('applies all defaults when the object is empty', () => {
    const result = PaginationSchema.parse({});

    expect(result.page).toBe(1);
    expect(result.perPage).toBe(15);
    expect(result.totalCount).toBe(0);
    expect(result.totalPages).toBe(0);
  });

  it('accepts explicit numeric values', () => {
    const result = PaginationSchema.parse({
      page: 3,
      perPage: 25,
      totalCount: 100,
      totalPages: 4,
    });

    expect(result.page).toBe(3);
    expect(result.perPage).toBe(25);
    expect(result.totalCount).toBe(100);
    expect(result.totalPages).toBe(4);
  });

  describe('coercion', () => {
    it('coerces a string page to a number', () => {
      const result = PaginationSchema.parse({ page: '2', perPage: '30' });

      expect(result.page).toBe(2);
      expect(result.perPage).toBe(30);
    });

    it('rejects a non-numeric string — coerce produces NaN which z.number() rejects', () => {
      expect(PaginationSchema.safeParse({ page: 'abc' }).success).toBe(false);
    });

    it('coerces an empty string to 0, overriding the default of 1', () => {
      const result = PaginationSchema.parse({ page: '' });

      expect(result.page).toBe(0);
    });
  });

  describe('totalCount / totalPages', () => {
    it('rejects non-numeric values for totalCount', () => {
      expect(PaginationSchema.safeParse({ totalCount: 'lots' }).success).toBe(
        false,
      );
    });

    it('rejects non-numeric values for totalPages', () => {
      expect(PaginationSchema.safeParse({ totalPages: 'many' }).success).toBe(
        false,
      );
    });
  });
});
