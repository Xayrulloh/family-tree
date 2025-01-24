import { Inject, Injectable, NotFoundException } from '@nestjs/common';
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

  async create(
    body: FCMTokenCreateDeleteRequestType
  ): Promise<FCMTokenResponseType> {
    const FCMToken = await this.db
      .insert(schema.FCMTokensSchema)
      .values({
        userId: 'body.user_id',
        token: body.token,
        deviceType: body.deviceType,
      })
      .returning();

    return FCMToken[0];
  }

  async delete(body: FCMTokenCreateDeleteRequestType): Promise<void> {
    const FCMToken = await this.db.query.FCMTokensSchema.findFirst({
      where: and(
        eq(schema.FCMTokensSchema.userId, 'body.user_id'),
        eq(schema.FCMTokensSchema.token, body.token),
        eq(schema.FCMTokensSchema.deviceType, body.deviceType),
        isNull(schema.FCMTokensSchema.deletedAt)
      ),
    });

    if (!FCMToken) {
      throw new NotFoundException(
        `FCM Token with device type ${body.deviceType} and token ${body.token} not found`
      );
    }

    await this.db
      .update(schema.FCMTokensSchema)
      .set({
        deletedAt: new Date().toISOString(),
      })
      .where(eq(schema.FCMTokensSchema.id, FCMToken.id));
  }
}
