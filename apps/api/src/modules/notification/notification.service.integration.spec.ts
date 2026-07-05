/// <reference types="jest" />
import { and, eq } from 'drizzle-orm';
import * as schema from '~/database/schema';
import { seedUser } from '~/test/seeds';
import { getTestDb, truncateTables } from '~/test/test-db';
import { NotificationService } from './notification.service';

async function seedNotification(
  receiverUserId: string,
  senderUserId: string,
  content: string,
  createdAt: string,
) {
  const [row] = await getTestDb()
    .insert(schema.notificationsSchema)
    .values({ receiverUserId, senderUserId, content, createdAt })
    .returning();

  return row;
}

describe('NotificationService (integration)', () => {
  let service: NotificationService;

  beforeAll(() => {
    service = new NotificationService(getTestDb());
  });

  beforeEach(async () => {
    await truncateTables();
  });

  describe('getUserNotifications', () => {
    it('treats every notification as unread when there is no read record', async () => {
      const [receiver, sender] = await Promise.all([
        seedUser(getTestDb()),
        seedUser(getTestDb()),
      ]);

      await seedNotification(
        receiver.id,
        sender.id,
        'A',
        '2026-01-01T00:00:00.000Z',
      );

      await seedNotification(
        receiver.id,
        sender.id,
        'B',
        '2026-01-02T00:00:00.000Z',
      );

      const result = await service.getUserNotifications(receiver.id);

      expect(result.unReadNotifications).toHaveLength(2);
      expect(result.last5Notifications).toHaveLength(0);
    });

    it('splits notifications around the last read timestamp', async () => {
      const [receiver, sender] = await Promise.all([
        seedUser(getTestDb()),
        seedUser(getTestDb()),
      ]);

      const old = await seedNotification(
        receiver.id,
        sender.id,
        'old',
        '2026-01-01T00:00:00.000Z',
      );

      const fresh = await seedNotification(
        receiver.id,
        sender.id,
        'fresh',
        '2026-01-03T00:00:00.000Z',
      );

      await getTestDb()
        .insert(schema.notificationReadsSchema)
        .values({ userId: receiver.id, updatedAt: '2026-01-02T00:00:00.000Z' });

      const result = await service.getUserNotifications(receiver.id);

      expect(result.unReadNotifications.map((n) => n.id)).toEqual([fresh.id]);
      expect(result.last5Notifications.map((n) => n.id)).toEqual([old.id]);
    });

    it('returns only notifications addressed to the user', async () => {
      const [receiver, other, sender] = await Promise.all([
        seedUser(getTestDb()),
        seedUser(getTestDb()),
        seedUser(getTestDb()),
      ]);

      await seedNotification(
        receiver.id,
        sender.id,
        'mine',
        '2026-01-01T00:00:00.000Z',
      );

      await seedNotification(
        other.id,
        sender.id,
        'theirs',
        '2026-01-01T00:00:00.000Z',
      );

      const result = await service.getUserNotifications(receiver.id);

      expect(result.unReadNotifications).toHaveLength(1);
      expect(result.unReadNotifications[0].content).toBe('mine');
    });
  });

  describe('markAllAsRead', () => {
    it('creates a read record for a first-time reader, making all notifications read', async () => {
      const [receiver, sender] = await Promise.all([
        seedUser(getTestDb()),
        seedUser(getTestDb()),
      ]);

      await seedNotification(
        receiver.id,
        sender.id,
        'A',
        '2026-01-01T00:00:00.000Z',
      );

      await service.markAllAsRead(receiver.id);

      const result = await service.getUserNotifications(receiver.id);

      expect(result.unReadNotifications).toHaveLength(0);
      expect(result.last5Notifications).toHaveLength(1);
    });

    it('advances the read timestamp so prior notifications become read', async () => {
      const [receiver, sender] = await Promise.all([
        seedUser(getTestDb()),
        seedUser(getTestDb()),
      ]);

      await seedNotification(
        receiver.id,
        sender.id,
        'A',
        '2026-01-03T00:00:00.000Z',
      );

      await getTestDb()
        .insert(schema.notificationReadsSchema)
        .values({ userId: receiver.id, updatedAt: '2026-01-02T00:00:00.000Z' });

      await service.markAllAsRead(receiver.id);

      const result = await service.getUserNotifications(receiver.id);

      expect(result.unReadNotifications).toHaveLength(0);
      expect(result.last5Notifications).toHaveLength(1);

      const readRow = await getTestDb().query.notificationReadsSchema.findFirst(
        {
          where: and(eq(schema.notificationReadsSchema.userId, receiver.id)),
        },
      );

      expect(new Date(readRow!.updatedAt).getTime()).toBeGreaterThan(
        new Date('2026-01-02T00:00:00.000Z').getTime(),
      );
    });
  });
});
