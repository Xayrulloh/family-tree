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

  async getUserByEmail(email: string): Promise<UserResponseType> {
    const user = await this.db.query.usersSchema.findFirst({
      where: and(
        eq(schema.usersSchema.email, email),
        isNull(schema.usersSchema.deletedAt)
      ),
    });

    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }

    return user;
  }

  async getUserThemselves(id: string): Promise<UserResponseType> {
    const user = await this.db.query.usersSchema.findFirst({
      where: and(
        eq(schema.usersSchema.id, id),
        isNull(schema.usersSchema.deletedAt)
      ),
    });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return user;
  }

  async updateUser(id: string, body: UserUpdateRequestDto): Promise<void> {
    const user = await this.db.query.usersSchema.findFirst({
      where: and(
        eq(schema.usersSchema.id, id),
        isNull(schema.usersSchema.deletedAt)
      ),
    });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    if (user.gender !== body.gender) {
      // FIXME: Need to think about related family trees
    }

    if (user.image !== body.image) {
      // FIXME: must delete the old image
    }

    await this.db
      .update(schema.usersSchema)
      .set({
        ...body,
      })
      .where(eq(schema.usersSchema.id, id));
  }
}
