import {
  FCMTokenCreateDeleteRequestSchema,
  FCMTokenResponseSchema,
} from '@family-tree/shared';
import { createZodDto } from 'nestjs-zod';

class FCMTokenCreateDeleteRequestDto extends createZodDto(
  FCMTokenCreateDeleteRequestSchema
) {}

class FCMTokenResponseDto extends createZodDto(FCMTokenResponseSchema) {}

export { FCMTokenCreateDeleteRequestDto, FCMTokenResponseDto };
