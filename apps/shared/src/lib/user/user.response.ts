import { z } from 'zod';
import { UserSchema } from '../schema/user.schema';

const UserResponseSchema = UserSchema;

type UserResponseType = z.infer<typeof UserResponseSchema>;

export { UserResponseSchema, UserResponseType };
