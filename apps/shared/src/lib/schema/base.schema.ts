import { z } from 'zod';

const BaseSchema = z.object({
  id: z.string().uuid().describe('Primary key'),
  createdAt: z.coerce.date().describe('When it was created'),
  updatedAt: z.coerce.date().describe('When it was last updated'),
  deletedAt: z.coerce
    .date()
    .nullable()
    .describe(
      'When it was soft deleted, but most of the time it is hard deleted'
    ),
});

type BaseSchemaType = z.infer<typeof BaseSchema>;

export { BaseSchema, BaseSchemaType };
