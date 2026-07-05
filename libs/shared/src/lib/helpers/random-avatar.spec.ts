import { describe, expect, it } from 'vitest';
import { UserGenderEnum } from '../schema/user.schema';
import { generateRandomAvatar } from './random-avatar';

const BASE_URL = 'https://api.dicebear.com/9.x/notionists/svg';

function getParams(url: string): URLSearchParams {
  return new URLSearchParams(url.split('?')[1]);
}

describe('generateRandomAvatar', () => {
  it('returns a string', () => {
    expect(typeof generateRandomAvatar()).toBe('string');
  });

  it('points to the DiceBear notionists SVG endpoint', () => {
    expect(generateRandomAvatar().startsWith(`${BASE_URL}?`)).toBe(true);
  });

  it('includes a non-empty seed param', () => {
    expect(getParams(generateRandomAvatar()).get('seed')).toBeTruthy();
  });

  it('includes brows with all 12 variants', () => {
    const brows = getParams(generateRandomAvatar()).get('brows');

    expect(brows?.split(',')).toHaveLength(12);
  });

  it('includes glasses with 11 variants and probability 20', () => {
    const params = getParams(generateRandomAvatar());

    expect(params.get('glasses')?.split(',')).toHaveLength(11);
    expect(params.get('glassesProbability')).toBe('20');
  });

  it('includes lips with all 30 variants', () => {
    expect(
      getParams(generateRandomAvatar()).get('lips')?.split(','),
    ).toHaveLength(30);
  });

  it('includes nose with all 20 variants', () => {
    expect(
      getParams(generateRandomAvatar()).get('nose')?.split(','),
    ).toHaveLength(20);
  });

  describe('MALE', () => {
    it('sets beardProbability to 100 and includes all 12 beard variants', () => {
      const params = getParams(generateRandomAvatar(UserGenderEnum.MALE));

      expect(params.get('beardProbability')).toBe('100');
      expect(params.get('beard')?.split(',')).toHaveLength(12);
    });

    it('uses male hair list — contains "hat", excludes female-only variants', () => {
      const hair =
        getParams(generateRandomAvatar(UserGenderEnum.MALE)).get('hair') ?? '';

      expect(hair.split(',')).toContain('hat');
      expect(hair.split(',')).not.toContain('variant62');
    });
  });

  describe('FEMALE', () => {
    it('sets beardProbability to 0 and omits the beard param', () => {
      const params = getParams(generateRandomAvatar(UserGenderEnum.FEMALE));

      expect(params.get('beardProbability')).toBe('0');
      expect(params.get('beard')).toBeNull();
    });

    it('uses female hair list — contains "variant62", excludes male-only variants', () => {
      const hair =
        getParams(generateRandomAvatar(UserGenderEnum.FEMALE)).get('hair') ??
        '';

      expect(hair.split(',')).toContain('variant62');
      expect(hair.split(',')).not.toContain('hat');
    });
  });

  describe('no gender / UNKNOWN', () => {
    it('returns a valid DiceBear URL when called without a gender', () => {
      expect(generateRandomAvatar()).toMatch(/^https:\/\/api\.dicebear\.com/);
    });

    it('returns a valid DiceBear URL for UNKNOWN gender', () => {
      expect(generateRandomAvatar(UserGenderEnum.UNKNOWN)).toMatch(
        /^https:\/\/api\.dicebear\.com/,
      );
    });
  });

  it('generates a unique seed on each call', () => {
    const seeds = Array.from({ length: 5 }, () =>
      getParams(generateRandomAvatar()).get('seed'),
    );

    expect(new Set(seeds).size).toBeGreaterThan(1);
  });
});
