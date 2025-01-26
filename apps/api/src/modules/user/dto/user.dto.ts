import {
  UserCreateRequestSchema,
  UserFamilyTreeIdParamSchema,
  UserGetParamSchema,
  UserResponseSchema,
  UserUpdateRequestSchema,
  UserUsernameParamSchema,
} from '@family-tree/shared';
import { createZodDto } from 'nestjs-zod';

class UserCreateRequestDto extends createZodDto(UserCreateRequestSchema) {}
class UserUpdateRequestDto extends createZodDto(UserUpdateRequestSchema) {}
class UserUsernameParamDto extends createZodDto(UserUsernameParamSchema) {}
class UserGetParamDto extends createZodDto(UserGetParamSchema) {}
class UserFamilyTreeIdParamDto extends createZodDto(
  UserFamilyTreeIdParamSchema
) {}

class UserResponseDto extends createZodDto(UserResponseSchema) {}

export {
  UserCreateRequestDto,
  UserUpdateRequestDto,
  UserUsernameParamDto,
  UserGetParamDto,
  UserResponseDto,
  UserFamilyTreeIdParamDto,
};
