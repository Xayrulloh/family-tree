import {
  FCMTokenCreateDeleteRequestSchema,
  FCMTokenResponseSchema,
} from '@family-tree/shared';
import { createZodDto } from 'nestjs-zod';

// request
class FCMTokenCreateDeleteRequestDto extends createZodDto(
  FCMTokenCreateDeleteRequestSchema
) {}

// response
class FCMTokenResponseDto extends createZodDto(FCMTokenResponseSchema) {}

export { FCMTokenCreateDeleteRequestDto, FCMTokenResponseDto };
