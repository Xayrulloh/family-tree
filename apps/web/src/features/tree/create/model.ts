import { z } from 'zod';
import { createDisclosure } from '../../../shared/lib/disclosure';
import { createForm } from '../../../shared/lib/create-form';
import {
  attach,
  createEffect,
  createEvent,
  EventPayload,
  sample,
} from 'effector';
import { api } from '../../../shared/api';
import { RcFile } from 'antd/es/upload';

export type FormValues = z.infer<typeof formSchema>;

export const formSchema = z.object({
  name: z.string().min(1, { message: 'Required field' }),
  image: z.string().min(1, { message: 'Image is required' }),
});

export const formValidated = createEvent();
export const mutated = createEvent();

export const disclosure = createDisclosure();
export const form = createForm<FormValues>();

const resetFormFx = createEffect(() =>
  form.resetFx.prepend(() => ({
    name: '',
    image: null as unknown as string,
  }))()
);

const createTreeFx = attach({
  source: form.$formValues,
  effect: (body) => api.tree.create({ ...body, visibility: false }),
});

export const uploadFileFx = createEffect((file: RcFile) => {
  const formData = new FormData();

  formData.append('file', file);
  return api.file.upload('tree', formData);
});

export const $treeCreating = createTreeFx.pending;

sample({
  clock: uploadFileFx.doneData,
  source: form.$formValues,
  fn: (values, response) =>
    ({ ...values, image: response.data.key } satisfies FormValues),
  target: form.resetFx,
});

sample({
  clock: createTreeFx.doneData,
  target: [disclosure.closed, mutated],
});

sample({
  clock: disclosure.closed,
  target: resetFormFx,
});

form.$formValues.watch(console.log);
