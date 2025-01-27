import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import * as schema from '../../database/schema';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DrizzleAsyncProvider } from '../../database/drizzle.provider';
import { UserResponseType } from '@family-tree/shared';
import { and, eq, isNull } from 'drizzle-orm';
import { UserUpdateRequestDto } from './dto/user.dto';

@Injectable()
export class UserService {
  constructor(
    @Inject(DrizzleAsyncProvider)
    private db: NodePgDatabase<typeof schema>
  ) {}

  async getUserByUsername(username: string): Promise<UserResponseType> {
    const [user] = await this.db
      .select()
      .from(schema.usersSchema)
      .where(
        and(
          eq(schema.usersSchema.username, username),
          isNull(schema.usersSchema.deletedAt)
        )
      )
      .limit(1);

    if (!user) {
      throw new NotFoundException(`User with username ${username} not found`);
    }

    return user;
  }

  async getUserThemselves(id: string): Promise<UserResponseType> {
    const [user] = await this.db
      .select()
      .from(schema.usersSchema)
      .where(
        and(eq(schema.usersSchema.id, id), isNull(schema.usersSchema.deletedAt))
      )
      .limit(1);

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return user;
  }

  async updateUser(id: string, body: UserUpdateRequestDto): Promise<void> {
    const [user] = await this.db
      .select()
      .from(schema.usersSchema)
      .where(
        and(eq(schema.usersSchema.id, id), isNull(schema.usersSchema.deletedAt))
      )
      .limit(1);

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    if (user.gender !== body.gender) {
      // FIXME:  think about it
    }

    if (user.image !== body.image) {
      // FIXME:  think about it
    }

    await this.db
      .update(schema.usersSchema)
      .set({
        ...body,
      })
      .where(eq(schema.usersSchema.id, id));
  }
}
