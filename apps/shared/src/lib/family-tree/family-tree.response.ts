import { z } from 'zod';
import { FamilyTreeSchema } from '../schema/family-tree.schema';

const FamilyTreeResponseSchema = FamilyTreeSchema;

const FamilyTreeArrayResponseSchema = FamilyTreeResponseSchema.array();

type FamilyTreeResponseType = z.infer<typeof FamilyTreeResponseSchema>;

type FamilyTreeArrayResponseType = z.infer<
  typeof FamilyTreeArrayResponseSchema
>;

export {
  FamilyTreeResponseSchema,
  FamilyTreeResponseType,
  FamilyTreeArrayResponseSchema,
  FamilyTreeArrayResponseType,
};
