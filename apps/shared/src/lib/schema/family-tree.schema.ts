import * as z from 'zod';
import { BaseSchema } from './base.schema';

const FamilyTreeSchema = z
  .object({
    createdBy: z.string().min(1).describe('User who created this family tree'),
    name: z.string().min(1).min(3).describe('Name of family tree'),
    image: z
      .string()
      .nullable()
      .describe(
        'Image url which comes only from client side but may delete from back on updates'
      ),
    visibility: z
      .boolean()
      .default(false)
      .nullable()
      .describe('Public or private. Public would be visible to all users'),
  })
  .merge(BaseSchema);

type FamilyTreeSchemaType = z.infer<typeof FamilyTreeSchema>;

export { FamilyTreeSchema, FamilyTreeSchemaType };
