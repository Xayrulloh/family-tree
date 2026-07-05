import { allSettled, fork } from 'effector';
import { describe, expect, it, vi } from 'vitest';
import * as model from './model';

describe('tree/share model (integration)', () => {
  it('shareTrigger builds a /shared url and opens the disclosure', async () => {
    const scope = fork();

    await allSettled(model.shareTrigger, {
      scope,
      params: { id: 'tree-1', scope: 'shared' },
    });

    expect(scope.getState(model.$shareUrl)).toMatch(
      /\/family-trees\/shared\/tree-1$/,
    );

    expect(scope.getState(model.disclosure.$isOpen)).toBe(true);
  });

  it('shareTrigger uses the /public segment for public scope', async () => {
    const scope = fork();

    await allSettled(model.shareTrigger, {
      scope,
      params: { id: 'tree-1', scope: 'public' },
    });

    expect(scope.getState(model.$shareUrl)).toMatch(
      /\/family-trees\/public\/tree-1$/,
    );
  });

  it('shareTrigger falls back to /shared for owner scope', async () => {
    const scope = fork();

    await allSettled(model.shareTrigger, {
      scope,
      params: { id: 'tree-1', scope: 'owner' },
    });

    expect(scope.getState(model.$shareUrl)).toMatch(
      /\/family-trees\/shared\/tree-1$/,
    );
  });

  it('copyTrigger copies the url and closes the disclosure', async () => {
    const copyHandler = vi.fn().mockResolvedValue(undefined);

    const scope = fork({
      handlers: [[model.copyToClipboardFx, copyHandler]],
    });

    await allSettled(model.shareTrigger, {
      scope,
      params: { id: 'tree-1', scope: 'shared' },
    });

    await allSettled(model.copyTrigger, { scope });

    expect(copyHandler).toHaveBeenCalledWith(
      expect.stringContaining('/family-trees/shared/tree-1'),
    );

    expect(scope.getState(model.disclosure.$isOpen)).toBe(false);
  });
});
