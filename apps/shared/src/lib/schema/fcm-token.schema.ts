import * as z from 'zod'
import { BaseSchema } from './base.schema'

enum FCMTokenDeviceEnum {
  ANDROID = 'ANDROID',
  IOS = 'IOS',
  WEB = 'WEB'
}

const FCMTokenSchema = z.object({
  userId: z.string().nonempty(),
  token: z.string().nonempty(),
  deviceType: z.nativeEnum(FCMTokenDeviceEnum)
}).merge(BaseSchema)

type FCMTokenSchemaType = z.infer<typeof FCMTokenSchema>

export { FCMTokenSchema, FCMTokenSchemaType, FCMTokenDeviceEnum }