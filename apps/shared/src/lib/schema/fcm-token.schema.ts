import * as z from 'zod'
import { BaseSchema } from './base.schema'

enum FCMTokenDeviceEnum {
  ANDROID = 'ANDROID',
  IOS = 'IOS',
  WEB = 'WEB'
}

const FCMTokenSchema = z.object({
  userId: z.string().min(1),
  token: z.string().min(1),
  deviceType: z.nativeEnum(FCMTokenDeviceEnum)
}).merge(BaseSchema)

type FCMTokenSchemaType = z.infer<typeof FCMTokenSchema>

export { FCMTokenSchema, FCMTokenSchemaType, FCMTokenDeviceEnum }