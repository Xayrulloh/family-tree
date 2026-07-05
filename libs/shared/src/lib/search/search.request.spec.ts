import { describe, expect, it } from 'vitest';
import {
  SearchByNameQuerySchema,
  SearchByPublicQuerySchema,
} from './search.request';

describe('SearchByNameQuerySchema', () => {
  it('accepts an empty query — name is optional', () => {
    expect(SearchByNameQuerySchema.safeParse({}).success).toBe(true);
  });

  it('accepts a name of 3 or more characters', () => {
    expect(SearchByNameQuerySchema.safeParse({ name: 'Smi' }).success).toBe(
      true,
    );
  });

  it('rejects a name shorter than 3 characters', () => {
    expect(SearchByNameQuerySchema.safeParse({ name: 'Ab' }).success).toBe(
      false,
    );
  });

  it('does not expose the email search field', () => {
    const result = SearchByNameQuerySchema.parse({ email: 'a@b.co' });

    expect(result).not.toHaveProperty('email');
  });
});

describe('SearchByPublicQuerySchema', () => {
  it('accepts an empty query — isPublic is optional', () => {
    expect(SearchByPublicQuerySchema.safeParse({}).success).toBe(true);
  });

  it('coerces string "true" to boolean true (URL query params arrive as strings)', () => {
    const result = SearchByPublicQuerySchema.parse({ isPublic: 'true' });

    expect(result.isPublic).toBe(true);
  });
});
