import type { JwtPayloadType, UserSchemaType } from '@family-tree/shared';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DrizzleAsyncProvider } from '~/database/drizzle.provider';
import * as schema from '~/database/schema';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    @Inject(DrizzleAsyncProvider)
    private db: NodePgDatabase<typeof schema>,
  ) {}

  generateJwt(payload: JwtPayloadType) {
    return this.jwtService.signAsync(payload);
  }

  async signIn(user: UserSchemaType) {
    if (!user?.email) {
      throw new BadRequestException('Unauthenticated');
    }

    const userExists = await this.db.query.usersSchema.findFirst({
      where: eq(schema.usersSchema.email, user.email),
    });

    if (!userExists) {
      return this.registerUser(user);
    }

    return this.generateJwt({
      sub: userExists.id,
      // email is guaranteed non-null: usersSchema defines it as text().notNull()
      email: userExists.email as string,
    });
  }

  async registerUser(user: UserSchemaType) {
    if (!user?.email) {
      throw new BadRequestException('Unauthenticated');
    }

    const [newUser] = await this.db
      .insert(schema.usersSchema)
      .values({
        email: user.email,
        name: user.name,
        username: `${user.email.split('@')[0]}-${user.id}`,
        image: user.image,
        gender: user.gender,
      })
      .returning();

    return this.generateJwt({
      sub: newUser.id,
      // email is guaranteed non-null: inserted value comes from validated UserSchemaType
      email: newUser.email as string,
    });
  }
}
