import { UserSchemaType } from '@family-tree/shared';

declare global {
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-empty-interface
    interface User extends UserSchemaType {}

    interface Request {
      user: User;
    }
  }
}
