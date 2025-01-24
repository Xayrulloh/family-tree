import {
  BadRequestException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as schema from '../../database/schema';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DrizzleAsyncProvider } from '../../database/drizzle.provider';
import { JwtPayloadType, UserSchemaType } from '@family-tree/shared';

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
    if (!user) {
      throw new BadRequestException('Unauthenticated');
    }

    const userExists = await this.db.query.usersSchema.findFirst({
      where: (users, { eq }) => eq(users.email, user.email),
    })

    if (!userExists) {
      return this.registerUser(user);
    }

    return this.generateJwt({
      sub: userExists.id,
      email: userExists.email,
    });
  }

  async registerUser(user: UserSchemaType) {

    const newUser = await this.db.insert(schema.usersSchema).values({
      email: user.email,
      name: user.name,
      username: user.email.split('@')[0] + `-${user.id}`,
      image: user.image,
      gender: user.gender,
    }).returning()

    return this.generateJwt({
      sub: newUser[0].id,
      email: newUser[0].email,
    });

  }
}