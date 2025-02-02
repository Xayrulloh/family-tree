import { z } from 'zod';
import { UserResponseSchema } from '../user';

const FamilyTreeRelationshipResponseSchema = z.object({
  parents: z
    .object({
      mergedParentId: z.string().min(10),
      father: UserResponseSchema,
      mother: UserResponseSchema,
    })
    .array(),
  children: z
    .object({
      mergedParentId: z.string().min(10),
      children: UserResponseSchema.array(),
    })
    .array(),
});

const FamilyTreeRelationshipUserResponseSchema = UserResponseSchema;

const FamilyTreeRelationshipUserArrayResponseSchema =
  UserResponseSchema.array();

type FamilyTreeRelationshipResponseType = z.infer<
  typeof FamilyTreeRelationshipResponseSchema
>;

type FamilyTreeRelationshipUserResponseType = z.infer<
  typeof FamilyTreeRelationshipUserResponseSchema
>;

type FamilyTreeRelationshipUserArrayResponseType = z.infer<
  typeof FamilyTreeRelationshipUserArrayResponseSchema
>;

export {
  FamilyTreeRelationshipResponseSchema,
  FamilyTreeRelationshipUserResponseSchema,
  FamilyTreeRelationshipUserArrayResponseSchema,
  FamilyTreeRelationshipResponseType,
  FamilyTreeRelationshipUserResponseType,
  FamilyTreeRelationshipUserArrayResponseType,
};
