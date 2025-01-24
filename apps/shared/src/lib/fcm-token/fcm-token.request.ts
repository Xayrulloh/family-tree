import { z } from 'zod';
import { FCMTokenSchema } from '../schema/fcm-token.schema';

const FCMTokenCreateDeleteRequestSchema = FCMTokenSchema.pick({
  token: true,
  deviceType: true,
});

type FCMTokenCreateDeleteRequestType = z.infer<
  typeof FCMTokenCreateDeleteRequestSchema
>;

export { FCMTokenCreateDeleteRequestSchema, FCMTokenCreateDeleteRequestType };
