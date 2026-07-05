import { describe, expect, it } from 'vitest';
import { PaginationQuerySchema } from './pagination.request';

describe('PaginationQuerySchema', () => {
  it('applies defaults when the query is empty', () => {
    const result = PaginationQuerySchema.parse({});

    expect(result.page).toBe(1);
    expect(result.perPage).toBe(15);
  });

  it('coerces string values to numbers (URL query params arrive as strings)', () => {
    const result = PaginationQuerySchema.parse({ page: '3', perPage: '30' });

    expect(result.page).toBe(3);
    expect(result.perPage).toBe(30);
  });

  it('rejects non-numeric strings', () => {
    expect(PaginationQuerySchema.safeParse({ page: 'abc' }).success).toBe(
      false,
    );
  });

  it('does not expose totalCount/totalPages — they are response-only fields', () => {
    const result = PaginationQuerySchema.parse({ totalCount: 99 });

    expect(result).not.toHaveProperty('totalCount');
  });
});
