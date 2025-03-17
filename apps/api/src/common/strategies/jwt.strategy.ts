import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as schema from '../../database/schema';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DrizzleAsyncProvider } from '../../database/drizzle.provider';
import { JwtPayloadType, UserSchemaType } from '@family-tree/shared';
import { Request } from 'express';
import { COOKIES_ACCESS_TOKEN_KEY } from '../../utils/constants';
import { and, eq, isNull } from 'drizzle-orm';
import { EnvType } from '../../config/env/env-validation';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private configService: ConfigService,
    @Inject(DrizzleAsyncProvider)
    private db: NodePgDatabase<typeof schema>
  ) {
    const extractJwtFromCookie = (req: Request) => {
      let token = null;

      if (req && req.cookies) {
        token = req.cookies[COOKIES_ACCESS_TOKEN_KEY];
      }

      return token || ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    };

    super({
      ignoreExpiration: false,
      secretOrKey: configService.get<EnvType['JWT_SECRET']>('JWT_SECRET') as string,
      jwtFromRequest: extractJwtFromCookie,
    });
  }

  async validate(payload: JwtPayloadType): Promise<UserSchemaType> {
    const user = await this.db.query.usersSchema.findFirst({
      where: and(
        eq(schema.usersSchema.email, payload.email),
        isNull(schema.usersSchema.deletedAt)
      ),
    });

    if (!user) throw new UnauthorizedException('Please log in to continue');

    return user;
  }
}
