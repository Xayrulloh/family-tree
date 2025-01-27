import * as z from 'zod';
import { BaseSchema } from './base.schema';

enum FCMTokenDeviceEnum {
  ANDROID = 'ANDROID',
  IOS = 'IOS',
  WEB = 'WEB',
}

const FCMTokenSchema = z
  .object({
    userId: z.string().min(1).describe('Defines to whom it belongs'),
    token: z.string().min(1).describe('Unique token from FCM'),
    deviceType: z
      .nativeEnum(FCMTokenDeviceEnum)
      .describe('To send all devices of user'),
  })
  .merge(BaseSchema);

type FCMTokenSchemaType = z.infer<typeof FCMTokenSchema>;

export { FCMTokenSchema, FCMTokenSchemaType, FCMTokenDeviceEnum };
