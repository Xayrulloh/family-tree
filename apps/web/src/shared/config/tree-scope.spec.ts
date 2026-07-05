import { describe, expect, it } from 'vitest';
import { scopeSegment } from './tree-scope';

describe('scopeSegment', () => {
  it('returns an empty string for owner scope', () => {
    expect(scopeSegment('owner')).toBe('');
  });

  it('returns /shared for shared scope', () => {
    expect(scopeSegment('shared')).toBe('/shared');
  });

  it('returns /public for public scope', () => {
    expect(scopeSegment('public')).toBe('/public');
  });

  it('defaults to owner when called with no argument', () => {
    expect(scopeSegment()).toBe('');
  });
});
