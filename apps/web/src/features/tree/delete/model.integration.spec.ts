import { allSettled, fork } from 'effector';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from '~/shared/api';
import * as model from './model';

describe('tree/delete model (integration)', () => {
  afterEach(() => vi.restoreAllMocks());

  it('deleteTrigger opens the disclosure and stores the id', async () => {
    const scope = fork();

    await allSettled(model.deleteTrigger, { scope, params: { id: 'tree-1' } });

    expect(scope.getState(model.disclosure.$isOpen)).toBe(true);
    expect(scope.getState(model.$id)).toBe('tree-1');
  });

  it('deleted calls api.tree.delete with the stored id', async () => {
    const deleteSpy = vi
      .spyOn(api.tree, 'delete')
      .mockResolvedValue({ data: {} } as never);

    const scope = fork();

    await allSettled(model.deleteTrigger, { scope, params: { id: 'tree-1' } });
    await allSettled(model.deleted, { scope });

    expect(deleteSpy).toHaveBeenCalledWith('tree-1');
  });

  it('closes the disclosure and resets the id after a successful delete', async () => {
    vi.spyOn(api.tree, 'delete').mockResolvedValue({ data: {} } as never);

    const scope = fork();

    await allSettled(model.deleteTrigger, { scope, params: { id: 'tree-1' } });
    await allSettled(model.deleted, { scope });

    expect(scope.getState(model.disclosure.$isOpen)).toBe(false);
    expect(scope.getState(model.$id)).toBeNull();
  });
});
