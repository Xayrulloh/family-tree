/// <reference types="jest" />
import generateRandomString from './random-string.helper';

describe('generateRandomString', () => {
  it('returns a string of the exact requested length', () => {
    expect(generateRandomString(10)).toHaveLength(10);
    expect(generateRandomString(32)).toHaveLength(32);
  });

  it('returns an empty string for length 0', () => {
    expect(generateRandomString(0)).toBe('');
  });

  it('returns a single character for length 1', () => {
    const result = generateRandomString(1);

    expect(result).toHaveLength(1);
    expect(result).toMatch(/^[A-Za-z0-9]$/);
  });

  it('only contains alphanumeric characters', () => {
    expect(generateRandomString(100)).toMatch(/^[A-Za-z0-9]+$/);
  });

  it('produces different results on consecutive calls', () => {
    const results = new Set(
      Array.from({ length: 10 }, () => generateRandomString(20)),
    );

    expect(results.size).toBeGreaterThan(1);
  });

  it('handles large lengths', () => {
    const result = generateRandomString(500);

    expect(result).toHaveLength(500);
    expect(result).toMatch(/^[A-Za-z0-9]+$/);
  });
});
