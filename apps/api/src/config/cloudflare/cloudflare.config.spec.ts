/// <reference types="jest" />
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import type { ConfigService } from '@nestjs/config';
import { CloudflareConfig } from './cloudflare.config';

const ENV: Record<string, string> = {
  CLOUDFLARE_ENDPOINT: 'https://r2.example.com',
  CLOUDFLARE_ACCESS_KEY_ID: 'access-key',
  CLOUDFLARE_SECRET_ACCESS_KEY: 'secret-key',
  CLOUDFLARE_URL: 'https://cdn.example.com',
};

const configService = {
  getOrThrow: (key: string) => ENV[key],
} as unknown as ConfigService;

describe('CloudflareConfig', () => {
  let sendSpy: jest.SpyInstance;
  let config: CloudflareConfig;

  beforeEach(() => {
    sendSpy = jest
      .spyOn(S3Client.prototype, 'send')
      .mockResolvedValue({} as never);
    config = new CloudflareConfig(configService);
  });

  afterEach(() => jest.restoreAllMocks());

  describe('uploadFile', () => {
    it('sends a PutObjectCommand with the folder-prefixed key and mimetype', async () => {
      const body = Buffer.from('image-bytes');

      await config.uploadFile('avatar', 'user-1.png', body, 'image/png');

      expect(sendSpy).toHaveBeenCalledTimes(1);

      const command = sendSpy.mock.calls[0][0] as PutObjectCommand;

      expect(command).toBeInstanceOf(PutObjectCommand);
      expect(command.input).toEqual({
        Bucket: 'family-tree',
        Key: 'avatar/user-1.png',
        Body: body,
        ContentType: 'image/png',
      });
    });

    it('swallows S3 errors instead of throwing (upload is best-effort)', async () => {
      sendSpy.mockRejectedValueOnce(new Error('R2 down'));

      await expect(
        config.uploadFile('tree', 'a.png', Buffer.from(''), 'image/png'),
      ).resolves.toBeUndefined();
    });
  });

  describe('deleteFile', () => {
    it('sends a DeleteObjectCommand with the key extracted from the CDN path', async () => {
      await config.deleteFile('https://cdn.example.com/avatar/user-1.png');

      expect(sendSpy).toHaveBeenCalledTimes(1);

      const command = sendSpy.mock.calls[0][0] as DeleteObjectCommand;

      expect(command).toBeInstanceOf(DeleteObjectCommand);
      expect(command.input).toEqual({
        Bucket: 'family-tree',
        Key: 'avatar/user-1.png',
      });
    });

    it('does nothing when the path is not on the configured CDN', async () => {
      await config.deleteFile('https://other-host.com/avatar/user-1.png');

      expect(sendSpy).not.toHaveBeenCalled();
    });

    it('swallows S3 errors instead of throwing (delete is best-effort)', async () => {
      sendSpy.mockRejectedValueOnce(new Error('R2 down'));

      await expect(
        config.deleteFile('https://cdn.example.com/tree/a.png'),
      ).resolves.toBeUndefined();
    });
  });
});
