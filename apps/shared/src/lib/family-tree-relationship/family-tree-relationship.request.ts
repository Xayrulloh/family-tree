import { z } from 'zod';
import { UserSchema } from '../schema';

const FamilyTreeRelationshipCreateRequestSchema = z.object({
  targetUserId: z.string().uuid(),
});

const FamilyTreeRelationshipCreateSonOrDaughterRequestSchema = z.object({
  fatherId: z.string().uuid(),
  motherId: z.string().uuid(),
});

const FamilyTreeRelationshipUpdateRequestSchema = UserSchema.pick({
  name: true,
  birthdate: true,
  deathdate: true,
  email: true,
  image: true,
});

const FamilyTreeRelationshipFamilyTreeIdParamSchema = z.object({
  familyTreeId: z.string().uuid(),
});

const FamilyTreeRelationshipFamilyTreeIdAndUserIdParamSchema =
  FamilyTreeRelationshipFamilyTreeIdParamSchema.extend({
    userId: z.string().uuid(),
  });

type FamilyTreeRelationshipCreateRequestType = z.infer<
  typeof FamilyTreeRelationshipCreateRequestSchema
>;

type FamilyTreeRelationshipUpdateRequestType = z.infer<
  typeof FamilyTreeRelationshipUpdateRequestSchema
>;

type FamilyTreeRelationshipFamilyTreeIdParamType = z.infer<
  typeof FamilyTreeRelationshipFamilyTreeIdParamSchema
>;

type FamilyTreeRelationshipFamilyTreeIdAndUserIdParamType = z.infer<
  typeof FamilyTreeRelationshipFamilyTreeIdAndUserIdParamSchema
>;

type FamilyTreeRelationshipCreateSonOrDaughterRequestType = z.infer<
  typeof FamilyTreeRelationshipCreateSonOrDaughterRequestSchema
>;

export {
  FamilyTreeRelationshipCreateRequestSchema,
  FamilyTreeRelationshipCreateSonOrDaughterRequestSchema,
  FamilyTreeRelationshipUpdateRequestSchema,
  FamilyTreeRelationshipFamilyTreeIdParamSchema,
  FamilyTreeRelationshipFamilyTreeIdAndUserIdParamSchema,
  FamilyTreeRelationshipCreateRequestType,
  FamilyTreeRelationshipCreateSonOrDaughterRequestType,
  FamilyTreeRelationshipUpdateRequestType,
  FamilyTreeRelationshipFamilyTreeIdParamType,
  FamilyTreeRelationshipFamilyTreeIdAndUserIdParamType,
};
