import * as z from 'zod';
import { BaseSchema } from './base.schema';

enum UserGenderEnum {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  UNKNOWN = 'UNKNOWN',
}

const UserSchema = z
  .object({
    email: z
      .string()
      .email()
      .nullable()
      .describe('Registered google email account'),
    name: z.string().min(1).min(3).describe('Default google account name'),
    username: z
      .string()
      .nullable()
      .describe(
        'Unique username from google and it only exist on registered users'
      ),
    image: z
      .string()
      .nullable()
      .describe(
        'Image url which comes only from client side but may delete from back on updates'
      ),
    gender: z
      .nativeEnum(UserGenderEnum)
      .describe(
        "Only male or female and for the beginning as we don't know we put unknown"
      ),
    deathdate: z.string().date().nullable().describe('Date of death'),
    birthdate: z.string().date().nullable().describe('Date of birth'),
  })
  .merge(BaseSchema);

type UserSchemaType = z.infer<typeof UserSchema>;

export { UserSchema, UserSchemaType, UserGenderEnum };
