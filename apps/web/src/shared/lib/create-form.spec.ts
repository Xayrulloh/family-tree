import { renderHook } from '@testing-library/react';
import type { UseFormReturn } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';
import { createForm } from './create-form';

type TestShape = { name: string; age: number };
type MockFormInstance = UseFormReturn<TestShape, unknown, undefined>;

function makeMockForm(watchReturn: Partial<TestShape> = {}) {
  return {
    clearErrors: vi.fn(),
    reset: vi.fn(),
    setError: vi.fn(),
    setValue: vi.fn(),
    watch: vi.fn().mockReturnValue(watchReturn),
  };
}

describe('createForm', () => {
  describe('initial state', () => {
    it('$formInstance starts as null', () => {
      const { $formInstance } = createForm<TestShape>();

      expect($formInstance.getState()).toBeNull();
    });

    it('$formValues starts as an empty object', () => {
      const { $formValues } = createForm<TestShape>();

      expect($formValues.getState()).toEqual({});
    });
  });

  describe('effects — throw when form is not bound', () => {
    it('clearErrorsFx throws when $formInstance is null', async () => {
      const { clearErrorsFx } = createForm<TestShape>();

      await expect(clearErrorsFx()).rejects.toThrow(
        'Form instance is not initialized',
      );
    });

    it('resetFx throws when $formInstance is null', async () => {
      const { resetFx } = createForm<TestShape>();

      await expect(resetFx({ name: '', age: 0 })).rejects.toThrow(
        'Form instance is not initialized',
      );
    });

    it('setErrorFx throws when $formInstance is null', async () => {
      const { setErrorFx } = createForm<TestShape>();

      await expect(
        setErrorFx({ name: 'name', message: 'err' }),
      ).rejects.toThrow('Form instance is not initialized');
    });

    it('setValueFx throws when $formInstance is null', async () => {
      const { setValueFx } = createForm<TestShape>();

      await expect(setValueFx({ name: 'name', value: 'x' })).rejects.toThrow(
        'Form instance is not initialized',
      );
    });
  });

  describe('useBindFormWithModel + effects', () => {
    it('populates $formInstance when the hook mounts', () => {
      const { $formInstance, useBindFormWithModel } = createForm<TestShape>();
      const mockForm = makeMockForm();

      renderHook(() =>
        useBindFormWithModel({ form: mockForm as unknown as MockFormInstance }),
      );

      expect($formInstance.getState()).toBe(mockForm);
    });

    it('resets $formInstance to null when the hook unmounts', () => {
      const { $formInstance, useBindFormWithModel } = createForm<TestShape>();
      const mockForm = makeMockForm();

      const { unmount } = renderHook(() =>
        useBindFormWithModel({ form: mockForm as unknown as MockFormInstance }),
      );

      unmount();

      expect($formInstance.getState()).toBeNull();
    });

    it('syncs form.watch() values to $formValues on mount', () => {
      const { $formValues, useBindFormWithModel } = createForm<TestShape>();
      const mockForm = makeMockForm({ name: 'Alice', age: 30 });

      renderHook(() =>
        useBindFormWithModel({ form: mockForm as unknown as MockFormInstance }),
      );

      expect($formValues.getState()).toEqual({ name: 'Alice', age: 30 });
    });

    it('clearErrorsFx calls form.clearErrors() after the form is bound', async () => {
      const { clearErrorsFx, useBindFormWithModel } = createForm<TestShape>();
      const mockForm = makeMockForm();

      renderHook(() =>
        useBindFormWithModel({ form: mockForm as unknown as MockFormInstance }),
      );

      await clearErrorsFx();

      expect(mockForm.clearErrors).toHaveBeenCalledOnce();
    });

    it('resetFx calls form.reset() with the provided values', async () => {
      const { resetFx, useBindFormWithModel } = createForm<TestShape>();
      const mockForm = makeMockForm();
      const values = { name: 'Bob', age: 25 };

      renderHook(() =>
        useBindFormWithModel({ form: mockForm as unknown as MockFormInstance }),
      );

      await resetFx(values);

      expect(mockForm.reset).toHaveBeenCalledWith(values);
    });

    it('setErrorFx calls form.setError() with name and message', async () => {
      const { setErrorFx, useBindFormWithModel } = createForm<TestShape>();
      const mockForm = makeMockForm();

      renderHook(() =>
        useBindFormWithModel({ form: mockForm as unknown as MockFormInstance }),
      );

      await setErrorFx({ name: 'name', message: 'Required' });

      expect(mockForm.setError).toHaveBeenCalledWith('name', {
        message: 'Required',
      });
    });

    it('setValueFx calls form.setValue() with name and value', async () => {
      const { setValueFx, useBindFormWithModel } = createForm<TestShape>();
      const mockForm = makeMockForm();

      renderHook(() =>
        useBindFormWithModel({ form: mockForm as unknown as MockFormInstance }),
      );

      await setValueFx({ name: 'name', value: 'Charlie' });

      expect(mockForm.setValue).toHaveBeenCalledWith('name', 'Charlie');
    });
  });
});
