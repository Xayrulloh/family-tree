import { z } from 'zod';
import { UserSchema } from '../schema/user.schema';

const UserUpdateRequestSchema = UserSchema.pick({
  gender: true,
  image: true,
  name: true,
  birthdate: true,
  deathdate: true,
}).partial();

const UserEmailParamSchema = z.object({
  email: z.string().email(),
});

type UserUpdateRequestType = z.infer<typeof UserUpdateRequestSchema>;
type UserUsernameParamType = z.infer<typeof UserEmailParamSchema>;

export {
  UserUpdateRequestSchema,
  UserUpdateRequestType,
  UserEmailParamSchema,
  UserUsernameParamType,
};
