import { z } from 'zod';
import { FCMTokenSchema } from '../schema/fcm-token.schema';

const FCMTokenResponseSchema = FCMTokenSchema;

type FCMTokenResponseType = z.infer<typeof FCMTokenResponseSchema>;

export { FCMTokenResponseSchema, FCMTokenResponseType };
