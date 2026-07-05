import { allSettled, fork } from 'effector';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from '~/shared/api';
import * as model from './model';

const baseValues = { name: 'Smith Family', image: null, isPublic: false };

describe('tree/create-edit model (integration)', () => {
  afterEach(() => vi.restoreAllMocks());

  it('createTrigger sets create mode and opens the form', async () => {
    const scope = fork();

    await allSettled(model.createTrigger, { scope });

    expect(scope.getState(model.$mode)).toBe('create');
    expect(scope.getState(model.disclosure.$isOpen)).toBe(true);
  });

  it('editTrigger sets edit mode, id, original tree and opens the form', async () => {
    const scope = fork();

    await allSettled(model.editTrigger, {
      scope,
      params: { id: 'tree-1', values: baseValues },
    });

    expect(scope.getState(model.$mode)).toBe('edit');
    expect(scope.getState(model.$id)).toBe('tree-1');
    expect(scope.getState(model.$originalTree)).toEqual(baseValues);
    expect(scope.getState(model.disclosure.$isOpen)).toBe(true);
  });

  it('creates a tree without an image via api.tree.create', async () => {
    const createSpy = vi
      .spyOn(api.tree, 'create')
      .mockResolvedValue({ data: {} } as never);

    const scope = fork({ values: [[model.form.$formValues, baseValues]] });

    await allSettled(model.createTrigger, { scope });
    await allSettled(model.formValidated, { scope });

    expect(createSpy).toHaveBeenCalledWith(baseValues);
  });

  it('does not call api.tree.update when editing with no changes', async () => {
    const updateSpy = vi
      .spyOn(api.tree, 'update')
      .mockResolvedValue({ data: {} } as never);

    const scope = fork({ values: [[model.form.$formValues, baseValues]] });

    await allSettled(model.editTrigger, {
      scope,
      params: { id: 'tree-1', values: baseValues },
    });

    await allSettled(model.formValidated, { scope });

    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('calls api.tree.update with the changed values when editing', async () => {
    const updateSpy = vi
      .spyOn(api.tree, 'update')
      .mockResolvedValue({ data: {} } as never);

    const changed = { name: 'Renamed Family', image: null, isPublic: true };
    const scope = fork({ values: [[model.form.$formValues, changed]] });

    await allSettled(model.editTrigger, {
      scope,
      params: { id: 'tree-1', values: baseValues },
    });

    await allSettled(model.formValidated, { scope });

    expect(updateSpy).toHaveBeenCalledWith('tree-1', changed);
  });
});
