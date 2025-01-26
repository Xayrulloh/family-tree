import { z } from 'zod';
import { UserSchema } from '../schema/user.schema';

const UserCreateRequestSchema = UserSchema.omit({ username: true, id: true });
const UserUpdateRequestSchema = UserCreateRequestSchema.partial();
const UserUsernameParamSchema = z.object({
  username: z
    .string()
    .min(1)
    .regex(/^[a-zA-Z]+-\d+$/),
});
const UserFamilyTreeIdParamSchema = z.object({
  familyTreeId: z.string().uuid(),
});
const UserGetParamSchema = UserFamilyTreeIdParamSchema.merge(
  z.object({
    userId: z.string().uuid(),
  })
);

type UserCreateRequestType = z.infer<typeof UserCreateRequestSchema>;

type UserUpdateRequestType = z.infer<typeof UserUpdateRequestSchema>;

type UserUsernameParamType = z.infer<typeof UserUsernameParamSchema>;

type UserGetParamType = z.infer<typeof UserGetParamSchema>;

type UserFamilyTreeIdParamType = z.infer<typeof UserFamilyTreeIdParamSchema>;

export {
  UserCreateRequestSchema,
  UserCreateRequestType,
  UserUpdateRequestSchema,
  UserUpdateRequestType,
  UserUsernameParamSchema,
  UserUsernameParamType,
  UserGetParamSchema,
  UserGetParamType,
  UserFamilyTreeIdParamSchema,
  UserFamilyTreeIdParamType,
};
