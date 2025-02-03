import { createZodDto } from 'nestjs-zod';
import {
  FamilyTreeRelationshipCreateRequestSchema,
  FamilyTreeRelationshipCreateSonOrDaughterRequestSchema,
  FamilyTreeRelationshipFamilyTreeIdAndUserIdParamSchema,
  FamilyTreeRelationshipFamilyTreeIdParamSchema,
  FamilyTreeRelationshipResponseSchema,
  FamilyTreeRelationshipUpdateRequestSchema,
  FamilyTreeRelationshipUserArrayResponseSchema,
  FamilyTreeRelationshipUserResponseSchema,
} from '@family-tree/shared';

// request
class FamilyTreeRelationshipCreateRequestDto extends createZodDto(
  FamilyTreeRelationshipCreateRequestSchema
) {}

class FamilyTreeRelationshipCreateSonOrDaughterRequestDto extends createZodDto(
  FamilyTreeRelationshipCreateSonOrDaughterRequestSchema
) {}

class FamilyTreeRelationshipUpdateRequestDto extends createZodDto(
  FamilyTreeRelationshipUpdateRequestSchema
) {}

class FamilyTreeRelationshipFamilyTreeIdParamDto extends createZodDto(
  FamilyTreeRelationshipFamilyTreeIdParamSchema
) {}

class FamilyTreeRelationshipFamilyTreeIdAndUserIdParamDto extends createZodDto(
  FamilyTreeRelationshipFamilyTreeIdAndUserIdParamSchema
) {}

// response
class FamilyTreeRelationshipResponseDto extends createZodDto(
  FamilyTreeRelationshipResponseSchema
) {}

class FamilyTreeRelationshipUserResponseDto extends createZodDto(
  FamilyTreeRelationshipUserResponseSchema
) {}

class FamilyTreeRelationshipUserArrayResponseDto extends createZodDto(
  FamilyTreeRelationshipUserArrayResponseSchema
) {}

export {
  FamilyTreeRelationshipCreateRequestDto,
  FamilyTreeRelationshipCreateSonOrDaughterRequestDto,
  FamilyTreeRelationshipUpdateRequestDto,
  FamilyTreeRelationshipFamilyTreeIdParamDto,
  FamilyTreeRelationshipFamilyTreeIdAndUserIdParamDto,
  FamilyTreeRelationshipResponseDto,
  FamilyTreeRelationshipUserResponseDto,
  FamilyTreeRelationshipUserArrayResponseDto,
};
