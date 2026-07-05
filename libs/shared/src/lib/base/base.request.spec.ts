import { describe, expect, it } from 'vitest';
import { IdQuerySchema } from './base.request';

describe('IdQuerySchema', () => {
  it('accepts a valid uuid id', () => {
    expect(
      IdQuerySchema.safeParse({ id: '550e8400-e29b-41d4-a716-446655440000' })
        .success,
    ).toBe(true);
  });

  it('rejects a non-uuid id', () => {
    expect(IdQuerySchema.safeParse({ id: 'not-a-uuid' }).success).toBe(false);
  });

  it('rejects a missing id', () => {
    expect(IdQuerySchema.safeParse({}).success).toBe(false);
  });

  it('strips fields that are not part of the pick', () => {
    const result = IdQuerySchema.parse({
      id: '550e8400-e29b-41d4-a716-446655440000',
      createdAt: '2024-01-01T00:00:00.000Z',
    });

    expect(result).toEqual({ id: '550e8400-e29b-41d4-a716-446655440000' });
  });
});
