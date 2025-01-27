import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as schema from '../../database/schema';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DrizzleAsyncProvider } from '../../database/drizzle.provider';
import {
  FCMTokenCreateDeleteRequestType,
  FCMTokenResponseType,
} from '@family-tree/shared';
import { and, eq, isNull } from 'drizzle-orm';

@Injectable()
export class FCMTokenService {
  constructor(
    @Inject(DrizzleAsyncProvider)
    private db: NodePgDatabase<typeof schema>
  ) {}

  async createFcmToken(
    userId: string,
    body: FCMTokenCreateDeleteRequestType
  ): Promise<FCMTokenResponseType> {
    const [isFCMTokenExist] = await this.db
      .select()
      .from(schema.FCMTokensSchema)
      .where(
        and(
          eq(schema.FCMTokensSchema.userId, userId),
          eq(schema.FCMTokensSchema.token, body.token),
          eq(schema.FCMTokensSchema.deviceType, body.deviceType),
          isNull(schema.FCMTokensSchema.deletedAt)
        )
      )
      .limit(1);

    if (isFCMTokenExist) {
      throw new BadRequestException(
        `FCM Token with device type ${body.deviceType} and token ${body.token} already exist`
      );
    }

    const [FCMToken] = await this.db
      .insert(schema.FCMTokensSchema)
      .values({
        userId,
        token: body.token,
        deviceType: body.deviceType,
      })
      .returning();

    return FCMToken;
  }

  async deleteFcmToken(
    userId: string,
    body: FCMTokenCreateDeleteRequestType
  ): Promise<void> {
    const [FCMToken] = await this.db
      .select()
      .from(schema.FCMTokensSchema)
      .where(
        and(
          eq(schema.FCMTokensSchema.userId, userId),
          eq(schema.FCMTokensSchema.token, body.token),
          eq(schema.FCMTokensSchema.deviceType, body.deviceType),
          isNull(schema.FCMTokensSchema.deletedAt)
        )
      )
      .limit(1);

    if (!FCMToken) {
      throw new NotFoundException(
        `FCM Token with device type ${body.deviceType} and token ${body.token} not found`
      );
    }

    await this.db
      .delete(schema.FCMTokensSchema)
      .where(eq(schema.FCMTokensSchema.id, FCMToken.id));
  }
}
