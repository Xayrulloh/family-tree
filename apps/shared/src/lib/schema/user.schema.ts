import * as z from 'zod'
import { BaseSchema } from './base.schema'

enum UserGenderEnum {
  MALE = 'MALE',
  FEMALE = 'FEMALE'
}

const UserSchema = z.object({
  name: z.string().nonempty().min(3),
  username: z.string().nullable(),
  image: z.string().nullable(),
  gender: z.nativeEnum(UserGenderEnum),
  alive: z.boolean(),
  birthdate: z.string().date().nullable()
}).merge(BaseSchema)

type UserSchemaType = z.infer<typeof UserSchema>

export { UserSchema, UserSchemaType, UserGenderEnum }