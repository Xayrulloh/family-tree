/// <reference types="jest" />
import { FCMTokenDeviceEnum } from '@family-tree/shared';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import * as schema from '~/database/schema';
import { seedUser } from '~/test/seeds';
import { getTestDb, truncateTables } from '~/test/test-db';
import { FCMTokenService } from './fcm-token.service';

describe('FCMTokenService (integration)', () => {
  let service: FCMTokenService;

  beforeAll(() => {
    service = new FCMTokenService(getTestDb());
  });

  beforeEach(async () => {
    await truncateTables();
  });

  describe('createFcmToken', () => {
    it('inserts and returns the token', async () => {
      const user = await seedUser(getTestDb());

      const result = await service.createFcmToken(user.id, {
        token: 'device-token-123',
        deviceType: FCMTokenDeviceEnum.WEB,
      });

      expect(result.token).toBe('device-token-123');
      expect(result.deviceType).toBe(FCMTokenDeviceEnum.WEB);

      const row = await getTestDb().query.FCMTokensSchema.findFirst({
        where: eq(schema.FCMTokensSchema.id, result.id),
      });

      expect(row).toBeDefined();
    });

    it('throws BadRequestException for a duplicate token on the same device', async () => {
      const user = await seedUser(getTestDb());
      await service.createFcmToken(user.id, {
        token: 'device-token-123',
        deviceType: FCMTokenDeviceEnum.WEB,
      });

      await expect(
        service.createFcmToken(user.id, {
          token: 'device-token-123',
          deviceType: FCMTokenDeviceEnum.WEB,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('allows the same token on a different device type', async () => {
      const user = await seedUser(getTestDb());

      await service.createFcmToken(user.id, {
        token: 'device-token-123',
        deviceType: FCMTokenDeviceEnum.WEB,
      });

      await expect(
        service.createFcmToken(user.id, {
          token: 'device-token-123',
          deviceType: FCMTokenDeviceEnum.ANDROID,
        }),
      ).resolves.toBeDefined();
    });
  });

  describe('deleteFcmToken', () => {
    it('removes the token', async () => {
      const user = await seedUser(getTestDb());
      const created = await service.createFcmToken(user.id, {
        token: 'device-token-123',
        deviceType: FCMTokenDeviceEnum.IOS,
      });

      await service.deleteFcmToken(user.id, {
        token: 'device-token-123',
        deviceType: FCMTokenDeviceEnum.IOS,
      });

      const row = await getTestDb().query.FCMTokensSchema.findFirst({
        where: eq(schema.FCMTokensSchema.id, created.id),
      });
      expect(row).toBeUndefined();
    });

    it('throws NotFoundException when the token does not exist', async () => {
      const user = await seedUser(getTestDb());

      await expect(
        service.deleteFcmToken(user.id, {
          token: 'ghost-token',
          deviceType: FCMTokenDeviceEnum.WEB,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
