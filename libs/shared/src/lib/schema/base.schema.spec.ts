import { describe, expect, it } from 'vitest';
import { BaseSchema } from './base.schema';

const VALID = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  deletedAt: null,
};

describe('BaseSchema', () => {
  it('accepts a valid object', () => {
    expect(BaseSchema.safeParse(VALID).success).toBe(true);
  });

  it('accepts deletedAt as an ISO string', () => {
    expect(
      BaseSchema.safeParse({ ...VALID, deletedAt: '2024-06-01T00:00:00.000Z' })
        .success,
    ).toBe(true);
  });

  it('accepts Date objects for timestamp fields and coerces them to ISO strings', () => {
    const date = new Date('2024-03-15T10:00:00.000Z');
    const result = BaseSchema.safeParse({
      ...VALID,
      createdAt: date,
      updatedAt: date,
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.createdAt).toBe(date.toISOString());
    }
  });

  describe('id', () => {
    it('rejects a non-UUID string', () => {
      expect(BaseSchema.safeParse({ ...VALID, id: 'not-a-uuid' }).success).toBe(
        false,
      );
    });

    it('rejects an empty id', () => {
      expect(BaseSchema.safeParse({ ...VALID, id: '' }).success).toBe(false);
    });

    it('rejects a missing id', () => {
      const { id: _id, ...rest } = VALID;

      expect(BaseSchema.safeParse(rest).success).toBe(false);
    });
  });

  describe('timestamp fields', () => {
    it('rejects an invalid date string for createdAt as a validation failure (not a thrown RangeError)', () => {
      const result = BaseSchema.safeParse({
        ...VALID,
        createdAt: 'not-a-date',
      });

      expect(result.success).toBe(false);
    });

    it('rejects an invalid Date object for createdAt as a validation failure', () => {
      const result = BaseSchema.safeParse({
        ...VALID,
        createdAt: new Date('not-a-date'),
      });

      expect(result.success).toBe(false);
    });

    it('rejects a missing createdAt', () => {
      const { createdAt: _c, ...rest } = VALID;

      expect(BaseSchema.safeParse(rest).success).toBe(false);
    });
  });
});
