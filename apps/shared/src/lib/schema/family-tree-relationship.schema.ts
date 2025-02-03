import * as z from 'zod';
import { BaseSchema } from './base.schema';

const FamilyTreeRelationshipSchema = z
  .object({
    ancestorId: z.string().uuid(),
    descendantId: z.string().uuid(),
    familyTreeId: z.string().uuid(),
    depth: z.number().min(1),
  })
  .merge(BaseSchema);

type FamilyTreeRelationshipSchemaType = z.infer<
  typeof FamilyTreeRelationshipSchema
>;

export { FamilyTreeRelationshipSchema, FamilyTreeRelationshipSchemaType };
