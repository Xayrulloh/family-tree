import * as z from 'zod';
import { BaseSchema } from './base.schema';

enum UserGenderEnum {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  UNKNOWN = 'UNKNOWN',
}

const UserSchema = z
  .object({
    email: z.string().email().nullable(),
    name: z.string().min(1).min(3),
    username: z.string().nullable(),
    image: z.string().nullable(),
    gender: z.nativeEnum(UserGenderEnum),
    deathdate: z.coerce.date().nullable(),
    birthdate: z.coerce.date().nullable(),
  })
  .merge(BaseSchema);

type UserSchemaType = z.infer<typeof UserSchema>;

export { UserSchema, UserSchemaType, UserGenderEnum };
