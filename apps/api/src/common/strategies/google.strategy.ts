import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth2';
import { DrizzleAsyncProvider } from '../../database/drizzle.provider';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../database/schema';
import { GoogleProfileType, UserGenderEnum } from '@family-tree/shared';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private configService: ConfigService,
    @Inject(DrizzleAsyncProvider)
    private db: NodePgDatabase<typeof schema>,
  ) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID')!,
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET')!,
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL')!,
      scope: ['profile', 'email'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: GoogleProfileType,
    done: VerifyCallback,
  ): Promise<void> {
    const { id, name, emails, photos } = profile;

    let user = await this.db.query.usersSchema.findFirst({
      where: (users, { eq }) => eq(users.email, emails[0].value)
    })

    if (!user) {
      const newUser = await this.db.insert(schema.usersSchema).values({
        email: emails[0].value,
        name: `${name.givenName} ${name.familyName}`,
        username: emails[0].value.split('@')[0] + `-${id}`,
        image: photos[0].value,
        gender: UserGenderEnum.UNKNOWN,
      }).returning()

      user = newUser[0]
    }

    done(null, user);
  }
}