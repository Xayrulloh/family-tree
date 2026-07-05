/// <reference types="jest" />
import { NotificationService } from './notification.service';

jest.mock('drizzle-orm', () => ({
  and: jest.fn(),
  desc: jest.fn(),
  eq: jest.fn(),
  gt: jest.fn(),
  notInArray: jest.fn(),
  sql: jest.fn((strings: TemplateStringsArray) => strings[0]),
}));

jest.mock('~/database/schema', () => ({
  notificationReadsSchema: { userId: 'userId' },
  notificationsSchema: {},
}));

jest.mock('~/database/drizzle.provider', () => ({
  DrizzleAsyncProvider: 'DrizzleAsyncProvider',
}));

describe('NotificationService', () => {
  describe('markAllAsRead', () => {
    it('upserts a notification_reads row for the given user', async () => {
      const mockOnConflictDoUpdate = jest.fn().mockResolvedValue(undefined);

      const mockValues = jest
        .fn()
        .mockReturnValue({ onConflictDoUpdate: mockOnConflictDoUpdate });

      const mockInsert = jest.fn().mockReturnValue({ values: mockValues });

      const service = new NotificationService({ insert: mockInsert } as any);

      await service.markAllAsRead('user-1');

      expect(mockInsert).toHaveBeenCalledWith({ userId: 'userId' });

      expect(mockValues).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          updatedAt: expect.anything(),
        }),
      );

      expect(mockOnConflictDoUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          target: 'userId',
          set: expect.objectContaining({ updatedAt: expect.anything() }),
        }),
      );
    });
  });
});
