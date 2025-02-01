import {
  UserResponseSchema,
  UserUpdateRequestSchema,
  UserEmailParamSchema,
} from '@family-tree/shared';
import { createZodDto } from 'nestjs-zod';

// request
class UserUpdateRequestDto extends createZodDto(UserUpdateRequestSchema) {}

class UserEmailParamDto extends createZodDto(UserEmailParamSchema) {}

// response
class UserResponseDto extends createZodDto(UserResponseSchema) {}

export { UserUpdateRequestDto, UserEmailParamDto, UserResponseDto };
