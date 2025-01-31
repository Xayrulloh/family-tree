import { z } from 'zod';
import { UserSchema } from '../schema/user.schema';

const UserUpdateRequestSchema = UserSchema.pick({
  gender: true,
  image: true,
  name: true,
  birthdate: true,
  deathdate: true,
}).partial();

const UserUsernameParamSchema = z.object({
  username: z.string().regex(/^[a-zA-Z]+-\d+$/),
});

type UserUpdateRequestType = z.infer<typeof UserUpdateRequestSchema>;
type UserUsernameParamType = z.infer<typeof UserUsernameParamSchema>;

export {
  UserUpdateRequestSchema,
  UserUpdateRequestType,
  UserUsernameParamSchema,
  UserUsernameParamType,
};
