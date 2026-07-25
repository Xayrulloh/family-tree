import {
  type GoogleProfileType,
  UserGenderEnum,
  type UserSchemaType,
} from '@family-tree/shared';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Strategy, type VerifyCallback } from 'passport-google-oauth2';
import type { EnvType } from '~/config/env/env-validation';
import { DrizzleAsyncProvider } from '~/database/drizzle.provider';
import * as schema from '~/database/schema';
import { DICEBEAR_URL } from '~/utils/constants';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    configService: ConfigService,
    @Inject(DrizzleAsyncProvider)
    private db: NodePgDatabase<typeof schema>,
  ) {
    super({
      clientID:
        configService.getOrThrow<EnvType['GOOGLE_CLIENT_ID']>(
          'GOOGLE_CLIENT_ID',
        ),
      clientSecret: configService.getOrThrow<EnvType['GOOGLE_CLIENT_SECRET']>(
        'GOOGLE_CLIENT_SECRET',
      ),
      callbackURL: configService.getOrThrow<EnvType['GOOGLE_CALLBACK_URL']>(
        'GOOGLE_CALLBACK_URL',
      ),
      scope: ['profile', 'email'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: GoogleProfileType,
    done: VerifyCallback,
  ): Promise<UserSchemaType> {
    const { id, name, emails, photos } = profile;

    let user = await this.db.query.usersSchema.findFirst({
      where: eq(schema.usersSchema.email, emails[0].value),
    });

    if (!user) {
      // create new user
      const [newUser] = await this.db
        .insert(schema.usersSchema)
        .values({
          email: emails[0].value,
          name: `${name.givenName} ${name.familyName}`,
          username: `${emails[0].value.split('@')[0]}-${id}`,
          image:
            photos[0].value || `${DICEBEAR_URL}/7.x/notionists/svg?seed=${id}`,
          gender: UserGenderEnum.UNKNOWN,
        })
        .returning();

      // create a default last read notification
      await this.db.insert(schema.notificationReadsSchema).values({
        userId: newUser.id,
      });

      user = newUser;
    }

    done(null, user);

    return user;
  }
}
