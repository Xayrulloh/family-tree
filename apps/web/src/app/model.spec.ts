import { allSettled, fork } from 'effector';
import { describe, expect, it } from 'vitest';
import { $theme, themeToggled } from './model';

describe('app model', () => {
  describe('$theme', () => {
    it('starts as light', () => {
      const scope = fork();

      expect(scope.getState($theme)).toBe('light');
    });

    it('themeToggled switches light to dark', async () => {
      const scope = fork();

      await allSettled(themeToggled, { scope });

      expect(scope.getState($theme)).toBe('dark');
    });

    it('themeToggled switches dark back to light', async () => {
      const scope = fork({ values: [[$theme, 'dark']] });

      await allSettled(themeToggled, { scope });

      expect(scope.getState($theme)).toBe('light');
    });

    it('toggles are idempotent over two calls', async () => {
      const scope = fork();

      await allSettled(themeToggled, { scope });
      await allSettled(themeToggled, { scope });

      expect(scope.getState($theme)).toBe('light');
    });
  });
});
