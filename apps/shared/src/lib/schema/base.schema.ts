import { z } from 'zod';

const BaseSchema = z.object({
  id: z.string().uuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable(),
});

type BaseSchemaType = z.infer<typeof BaseSchema>;

export { BaseSchema, BaseSchemaType };
