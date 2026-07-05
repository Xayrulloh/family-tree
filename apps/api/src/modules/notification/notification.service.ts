import type { NotificationResponseType } from '@family-tree/shared';
import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, gt, notInArray, sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DrizzleAsyncProvider } from '~/database/drizzle.provider';
import * as schema from '~/database/schema';

@Injectable()
export class NotificationService {
  constructor(
    @Inject(DrizzleAsyncProvider)
    private db: NodePgDatabase<typeof schema>,
  ) {}

  async getUserNotifications(
    userId: string,
  ): Promise<NotificationResponseType> {
    const lastReadNotification =
      await this.db.query.notificationReadsSchema.findFirst({
        where: and(eq(schema.notificationReadsSchema.userId, userId)),
        orderBy: desc(schema.notificationReadsSchema.updatedAt),
      });

    const unReadNotifications =
      await this.db.query.notificationsSchema.findMany({
        where: and(
          eq(schema.notificationsSchema.receiverUserId, userId),
          lastReadNotification?.updatedAt
            ? gt(
                schema.notificationsSchema.createdAt,
                lastReadNotification?.updatedAt,
              )
            : undefined,
        ),
      });

    const last5Notifications = await this.db.query.notificationsSchema.findMany(
      {
        where: and(
          eq(schema.notificationsSchema.receiverUserId, userId),
          notInArray(
            schema.notificationsSchema.id,
            unReadNotifications.map((notification) => notification.id),
          ),
        ),
        limit: 5,
        orderBy: desc(schema.notificationsSchema.createdAt),
      },
    );

    return {
      unReadNotifications,
      last5Notifications,
    };
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.db
      .insert(schema.notificationReadsSchema)
      .values({ userId, updatedAt: sql`now()` })
      .onConflictDoUpdate({
        target: schema.notificationReadsSchema.userId,
        set: {
          updatedAt: sql`GREATEST(excluded.updated_at, ${schema.notificationReadsSchema.updatedAt})`,
        },
      });
  }
}
