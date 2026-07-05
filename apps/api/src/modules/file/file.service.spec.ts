/// <reference types="jest" />
import type { CloudflareConfig } from '~/config/cloudflare/cloudflare.config';
import { FileService } from './file.service';

describe('FileService', () => {
  const cloudflareConfig = {
    uploadFile: jest.fn().mockResolvedValue(undefined),
    deleteFile: jest.fn().mockResolvedValue(undefined),
  };
  const service = new FileService(
    cloudflareConfig as unknown as CloudflareConfig,
  );

  afterEach(() => jest.clearAllMocks());

  it('uploadFile delegates folder, key, buffer, and mimetype to CloudflareConfig', async () => {
    const buffer = Buffer.from('image-bytes');

    await service.uploadFile('avatar', 'user-1.png', buffer, 'image/png');

    expect(cloudflareConfig.uploadFile).toHaveBeenCalledWith(
      'avatar',
      'user-1.png',
      buffer,
      'image/png',
    );
  });

  it('deleteFile delegates the path to CloudflareConfig', async () => {
    await service.deleteFile('https://cdn.example.com/avatar/user-1.png');

    expect(cloudflareConfig.deleteFile).toHaveBeenCalledWith(
      'https://cdn.example.com/avatar/user-1.png',
    );
  });
});
