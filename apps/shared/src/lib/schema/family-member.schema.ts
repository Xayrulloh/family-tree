import * as z from 'zod';
import { BaseSchema } from './base.schema';

const FamilyMemberSchema = z
  .object({
    familyTreeId: z.string().min(1),
    userId: z.string().min(1),
    parentFamilyTreeId: z.string().nullable(),
    spouseId: z.string().nullable(),
  })
  .merge(BaseSchema);

type FamilyMemberSchemaType = z.infer<typeof FamilyMemberSchema>;

export { FamilyMemberSchema, FamilyMemberSchemaType };
