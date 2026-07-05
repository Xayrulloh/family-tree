import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { formatTimeAgo } from './time-ago';

const FIXED_NOW = new Date('2024-06-01T12:00:00.000Z');

function secondsAgo(seconds: number): Date {
  return new Date(FIXED_NOW.getTime() - seconds * 1000);
}

describe('formatTimeAgo', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('seconds (< 60s)', () => {
    it('returns "0 seconds ago" for current time', () => {
      expect(formatTimeAgo(secondsAgo(0))).toBe('0 seconds ago');
    });

    it('returns "1 second ago" for 1 second', () => {
      expect(formatTimeAgo(secondsAgo(1))).toBe('1 second ago');
    });

    it('returns "30 seconds ago" for 30 seconds', () => {
      expect(formatTimeAgo(secondsAgo(30))).toBe('30 seconds ago');
    });

    it('returns "59 seconds ago" at the upper boundary', () => {
      expect(formatTimeAgo(secondsAgo(59))).toBe('59 seconds ago');
    });
  });

  describe('minutes (60s – 3599s)', () => {
    it('returns "1 minute ago" at exactly 60 seconds', () => {
      expect(formatTimeAgo(secondsAgo(60))).toBe('1 minute ago');
    });

    it('returns "1 minute ago" for 90 seconds', () => {
      expect(formatTimeAgo(secondsAgo(90))).toBe('1 minute ago');
    });

    it('returns "2 minutes ago" for 120 seconds', () => {
      expect(formatTimeAgo(secondsAgo(120))).toBe('2 minutes ago');
    });

    it('returns "59 minutes ago" at the upper boundary', () => {
      expect(formatTimeAgo(secondsAgo(3599))).toBe('59 minutes ago');
    });
  });

  describe('hours (3600s – 86399s)', () => {
    it('returns "1 hour ago" at exactly 3600 seconds', () => {
      expect(formatTimeAgo(secondsAgo(3600))).toBe('1 hour ago');
    });

    it('returns "2 hours ago" for 7200 seconds', () => {
      expect(formatTimeAgo(secondsAgo(7200))).toBe('2 hours ago');
    });

    it('returns "23 hours ago" at the upper boundary', () => {
      expect(formatTimeAgo(secondsAgo(86399))).toBe('23 hours ago');
    });
  });

  describe('days (86400s – 2591999s)', () => {
    it('returns "1 day ago" at exactly 86400 seconds', () => {
      expect(formatTimeAgo(secondsAgo(86400))).toBe('1 day ago');
    });

    it('returns "15 days ago" for 15 days', () => {
      expect(formatTimeAgo(secondsAgo(86400 * 15))).toBe('15 days ago');
    });

    it('returns "29 days ago" at the upper boundary', () => {
      expect(formatTimeAgo(secondsAgo(2591999))).toBe('29 days ago');
    });
  });

  describe('months (2592000s – 31535999s)', () => {
    it('returns "1 month ago" at exactly 2592000 seconds', () => {
      expect(formatTimeAgo(secondsAgo(2592000))).toBe('1 month ago');
    });

    it('returns "6 months ago" for 6 months', () => {
      expect(formatTimeAgo(secondsAgo(2592000 * 6))).toBe('6 months ago');
    });

    it('returns "12 months ago" at the upper boundary (31535999s = 12.16 months)', () => {
      expect(formatTimeAgo(secondsAgo(31535999))).toBe('12 months ago');
    });
  });

  describe('years (≥ 31536000s)', () => {
    it('returns "1 year ago" at exactly 31536000 seconds', () => {
      expect(formatTimeAgo(secondsAgo(31536000))).toBe('1 year ago');
    });

    it('returns "3 years ago" for 3 years', () => {
      expect(formatTimeAgo(secondsAgo(31536000 * 3))).toBe('3 years ago');
    });
  });
});
