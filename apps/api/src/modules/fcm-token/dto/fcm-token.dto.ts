import { FCMTokenSchema } from '@family-tree/shared';
import { createZodDto } from 'nestjs-zod';

class FCMTokenCreateDeleteRequestDto extends createZodDto(
  FCMTokenSchema.pick({ token: true, deviceType: true })
) {}

class FCMTokenResponseDto extends createZodDto(FCMTokenSchema) {}

export { FCMTokenCreateDeleteRequestDto, FCMTokenResponseDto };
