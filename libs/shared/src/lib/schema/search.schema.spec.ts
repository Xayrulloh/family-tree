import { describe, expect, it } from 'vitest';
import { SearchSchema } from './search.schema';

describe('SearchSchema', () => {
  it('accepts an empty object — all fields are optional', () => {
    expect(SearchSchema.safeParse({}).success).toBe(true);
  });

  describe('name', () => {
    it('accepts a name of 3 or more characters', () => {
      expect(SearchSchema.safeParse({ name: 'Smi' }).success).toBe(true);
    });

    it('rejects a name shorter than 3 characters', () => {
      expect(SearchSchema.safeParse({ name: 'Ab' }).success).toBe(false);
    });
  });

  describe('email', () => {
    it('accepts an email of 3 or more characters', () => {
      expect(SearchSchema.safeParse({ email: 'a@b' }).success).toBe(true);
    });

    it('rejects an email shorter than 3 characters', () => {
      expect(SearchSchema.safeParse({ email: 'a@' }).success).toBe(false);
    });
  });

  describe('isPublic coercion', () => {
    it('coerces string "true" to boolean true', () => {
      const result = SearchSchema.parse({ isPublic: 'true' });

      expect(result.isPublic).toBe(true);
    });

    it('coerces string "false" to boolean false', () => {
      const result = SearchSchema.parse({ isPublic: 'false' });

      expect(result.isPublic).toBe(false);
    });

    it('passes through boolean true unchanged', () => {
      const result = SearchSchema.parse({ isPublic: true });

      expect(result.isPublic).toBe(true);
    });

    it('passes through boolean false unchanged', () => {
      const result = SearchSchema.parse({ isPublic: false });

      expect(result.isPublic).toBe(false);
    });

    it('treats uppercase "TRUE" as false — preprocess only matches the lowercase string "true"', () => {
      const result = SearchSchema.parse({ isPublic: 'TRUE' });

      expect(result.isPublic).toBe(false);
    });

    it('treats a non-string non-boolean value (e.g. 1) as false', () => {
      const result = SearchSchema.parse({ isPublic: 1 });

      expect(result.isPublic).toBe(false);
    });
  });
});
