import { attach, createEvent, createStore } from 'effector';
import { useUnit } from 'effector-react';
import { useEffect } from 'react';
import type { UseFormReturn, FieldValues, Path } from 'react-hook-form';

export const createForm = <FormShape extends FieldValues>() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type FormInstance = UseFormReturn<FormShape, any, undefined>;

  const formInstanceChanged = createEvent<FormInstance>();
  const formValuesChanged = createEvent<FormShape>();
  const resetFormInstance = createEvent();

  const $formInstance = createStore<FormInstance | null>(null);
  const $formValues = createStore<FormShape>({} as FormShape);

  const clearErrorsFx = attach({
    source: $formInstance,
    effect: (form) => {
      if (!form) throw new Error('Form instance is not initialized');
      form.clearErrors();
    },
  });

  const resetFx = attach({
    source: $formInstance,
    effect: (form, formValues: FormShape) => {
      if (!form) throw new Error('Form instance is not initialized');
      form.reset(formValues);
    },
  });

  const setErrorFx = attach({
    source: $formInstance,
    effect: (
      form,
      { message, name }: { name: Path<FormShape>; message: string }
    ) => {
      if (!form) throw new Error('Form instance is not initialized');
      form.setError(name, { message });
    },
  });

  const useBindFormWithModel = ({ form }: { form: FormInstance }) => {
    const [
      handleFormInstanceChange,
      handleResetFormInstance,
      handleFormValuesChange,
    ] = useUnit([formInstanceChanged, resetFormInstance, formValuesChanged]);

    useEffect(() => {
      formInstanceChanged(form);

      return () => {
        resetFormInstance();
      };
    }, [form, handleFormInstanceChange, handleResetFormInstance]);

    const formValues = form.watch();

    useEffect(() => {
      handleFormValuesChange(formValues);
    }, [formValues, handleFormValuesChange]);
  };

  $formInstance
    .on(formInstanceChanged, (_, form) => form)
    .reset(resetFormInstance);
  $formValues.on(formValuesChanged, (_, values) => values);

  return {
    useBindFormWithModel,

    $formInstance,
    $formValues,

    clearErrorsFx,
    setErrorFx,
    resetFx,
  };
};
