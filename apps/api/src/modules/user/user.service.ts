import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as schema from '../../database/schema';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DrizzleAsyncProvider } from '../../database/drizzle.provider';
import { UserResponseType } from '@family-tree/shared';
import { and, eq, isNull } from 'drizzle-orm';
import { UserCreateRequestDto, UserGetParamDto } from './dto/user.dto';

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

  async getUser(param: UserGetParamDto): Promise<UserResponseType> {
    const [familyMember] = await this.db
      .select()
      .from(schema.familyMembersSchema)
      .where(
        and(
          eq(schema.familyMembersSchema.familyTreeId, param.familyTreeId),
          eq(schema.familyMembersSchema.userId, param.userId),
          isNull(schema.familyMembersSchema.deletedAt)
        )
      )
      .innerJoin(
        schema.usersSchema,
        eq(schema.familyMembersSchema.userId, schema.usersSchema.id)
      )
      .limit(1);

    if (!familyMember) {
      throw new NotFoundException(
        `User with id ${param.userId} and family tree id ${param.familyTreeId} not found`
      );
    }

    return familyMember.users;
  }

  async createFamilyTreeUser(
    userId: string,
    familyTreeId: string,
    body: UserCreateRequestDto
  ): Promise<UserResponseType> {
    const [familyMember] = await this.db
      .select()
      .from(schema.familyMembersSchema)
      .where(
        and(
          eq(schema.familyMembersSchema.familyTreeId, familyTreeId),
          eq(schema.familyMembersSchema.userId, userId),
          isNull(schema.familyMembersSchema.deletedAt)
        )
      )
      .limit(1);

    if (!familyMember) {
      throw new NotFoundException(
        `Family member with user id ${userId} and family tree id ${familyTreeId} not found`
      );
    }

    const [user] = await this.db
      .insert(schema.usersSchema)
      .values(body)
      .returning();

    await this.db.insert(schema.familyMembersSchema).values({
      familyTreeId,
      name: 'father', // FIXME: change it later
      userId,
    }); // FIXME: think about this part

    return user;
  }
}
