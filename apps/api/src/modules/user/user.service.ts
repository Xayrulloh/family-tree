import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import * as schema from '../../database/schema';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DrizzleAsyncProvider } from '../../database/drizzle.provider';
import { UserResponseType } from '@family-tree/shared';
import { and, eq, isNull } from 'drizzle-orm';
import { UserUpdateRequestDto } from './dto/user.dto';
import { CloudflareConfig } from '../../config/cloudflare/cloudflare.config';
import { CLOUDFLARE_USER_FOLDER } from '../../utils/constants';

@Injectable()
export class UserService {
  constructor(
    @Inject(DrizzleAsyncProvider)
    private db: NodePgDatabase<typeof schema>,
    private cloudflareConfig: CloudflareConfig
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

    if (body.image && user.image !== body.image) {
      this.cloudflareConfig.deleteFile(CLOUDFLARE_USER_FOLDER, body.image);
    }

    await this.db
      .update(schema.usersSchema)
      .set({
        ...body,
      })
      .where(eq(schema.usersSchema.id, id));
  }
}
