import {
  UserResponseSchema,
  UserUpdateRequestSchema,
  UserUsernameParamSchema,
} from '@family-tree/shared';
import { createZodDto } from 'nestjs-zod';

class UserUpdateRequestDto extends createZodDto(UserUpdateRequestSchema) {}
class UserUsernameParamDto extends createZodDto(UserUsernameParamSchema) {}

class UserResponseDto extends createZodDto(UserResponseSchema) {}

export { UserUpdateRequestDto, UserUsernameParamDto, UserResponseDto };
