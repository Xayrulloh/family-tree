import type { JwtPayloadType, UserSchemaType } from '@family-tree/shared';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { EnvType } from '~/config/env/env-validation';
import { DrizzleAsyncProvider } from '~/database/drizzle.provider';
import * as schema from '~/database/schema';
import { COOKIES_ACCESS_TOKEN_KEY } from '~/utils/constants';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    @Inject(DrizzleAsyncProvider)
    private db: NodePgDatabase<typeof schema>,
  ) {
    const extractJwtFromCookie = (req: Request) => {
      let token = null;

      if (req?.cookies) {
        token = req.cookies[COOKIES_ACCESS_TOKEN_KEY];
      }

      return token || ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    };

    super({
      ignoreExpiration: false,
      secretOrKey: configService.get<EnvType['JWT_SECRET']>(
        'JWT_SECRET',
      ) as string,
      jwtFromRequest: extractJwtFromCookie,
    });
  }

  async validate(payload: JwtPayloadType): Promise<UserSchemaType> {
    const user = await this.db.query.usersSchema.findFirst({
      where: eq(schema.usersSchema.email, payload.email),
    });

    if (!user) throw new UnauthorizedException('Please log in to continue');

    return user;
  }
}
