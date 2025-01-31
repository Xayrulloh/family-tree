import {
  FamilyTreeArrayResponseSchema,
  FamilyTreeCreateRequestSchema,
  FamilyTreeNameParamSchema,
  FamilyTreeResponseSchema,
  FamilyTreeUpdateRequestSchema,
  IdQuerySchema,
} from '@family-tree/shared';
import { createZodDto } from 'nestjs-zod';

// request // FIXME: lets separate by request and response

class FamilyTreeCreateRequestDto extends createZodDto(
  FamilyTreeCreateRequestSchema
) {} // FIXME: lets put space between them
class FamilyTreeUpdateRequestDto extends createZodDto(
  FamilyTreeUpdateRequestSchema
) {}
class FamilyTreeNameParamDto extends createZodDto(FamilyTreeNameParamSchema) {}
class FamilyTreeIdParamDto extends createZodDto(IdQuerySchema) {}

class FamilyTreeResponseDto extends createZodDto(FamilyTreeResponseSchema) {}
class FamilyTreeArrayResponseDto extends createZodDto(
  FamilyTreeArrayResponseSchema
) {}

export {
  FamilyTreeCreateRequestDto,
  FamilyTreeUpdateRequestDto,
  FamilyTreeNameParamDto,
  FamilyTreeIdParamDto,
  FamilyTreeResponseDto,
  FamilyTreeArrayResponseDto,
};
