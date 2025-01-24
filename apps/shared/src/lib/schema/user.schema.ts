import * as z from 'zod';
import { BaseSchema } from './base.schema';

enum UserGenderEnum {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  UNKNOWN = 'UNKNOWN',
}

const UserSchema = z
  .object({
    email: z.string().email(),
    name: z.string().min(1).min(3),
    username: z.string().nullable(),
    image: z.string().nullable(),
    gender: z.nativeEnum(UserGenderEnum),
    alive: z.boolean(),
    birthdate: z.string().date().nullable(),
  })
  .merge(BaseSchema);

type UserSchemaType = z.infer<typeof UserSchema>;

export { UserSchema, UserSchemaType, UserGenderEnum };
