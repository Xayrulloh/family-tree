/// <reference types="jest" />
import { UserGenderEnum } from '@family-tree/shared';
import { NotFoundException } from '@nestjs/common';
import { seedUser } from '~/test/seeds';
import { getTestDb, truncateTables } from '~/test/test-db';
import { UserService } from './user.service';

const mockCloudflareConfig = {
  deleteFile: jest.fn(),
  uploadFile: jest.fn(),
};

describe('UserService (integration)', () => {
  let service: UserService;

  beforeAll(() => {
    service = new UserService(getTestDb(), mockCloudflareConfig as any);
  });

  beforeEach(async () => {
    jest.resetAllMocks();
    await truncateTables();
  });

  describe('getUserById', () => {
    it('returns the user when the id exists', async () => {
      const user = await seedUser(getTestDb(), { name: 'Alice' });

      const result = await service.getUserById(user.id);

      expect(result.id).toBe(user.id);
      expect(result.name).toBe('Alice');
    });

    it('throws NotFoundException for an unknown id', async () => {
      await expect(
        service.getUserById('550e8400-e29b-41d4-a716-446655440000'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getUserByEmail', () => {
    it('returns the user when the email exists', async () => {
      const user = await seedUser(getTestDb(), { email: 'alice@test.com' });

      const result = await service.getUserByEmail('alice@test.com');

      expect(result.id).toBe(user.id);
      expect(result.email).toBe('alice@test.com');
    });

    it('throws NotFoundException for an unknown email', async () => {
      await expect(service.getUserByEmail('ghost@test.com')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getUserThemselves', () => {
    it('returns the user by their own id', async () => {
      const user = await seedUser(getTestDb());

      const result = await service.getUserThemselves(user.id);

      expect(result.id).toBe(user.id);
    });

    it('throws NotFoundException for an unknown id', async () => {
      await expect(
        service.getUserThemselves('550e8400-e29b-41d4-a716-446655440000'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateUser', () => {
    it('persists the updated fields', async () => {
      const user = await seedUser(getTestDb(), { name: 'Before' });

      await service.updateUser(user.id, { name: 'After' });

      const updated = await service.getUserById(user.id);

      expect(updated.name).toBe('After');
    });

    it('throws NotFoundException for an unknown id', async () => {
      await expect(
        service.updateUser('550e8400-e29b-41d4-a716-446655440000', {
          name: 'Ghost',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('calls deleteFile when the image changes', async () => {
      const user = await seedUser(getTestDb(), {
        image: 'https://r2.example.com/old.png',
      });

      await service.updateUser(user.id, {
        image: 'https://r2.example.com/new.png',
      });

      expect(mockCloudflareConfig.deleteFile).toHaveBeenCalledWith(
        'https://r2.example.com/old.png',
      );
    });

    it('does not call deleteFile when the image is unchanged', async () => {
      const user = await seedUser(getTestDb(), {
        image: 'https://r2.example.com/same.png',
      });

      await service.updateUser(user.id, {
        image: 'https://r2.example.com/same.png',
      });

      expect(mockCloudflareConfig.deleteFile).not.toHaveBeenCalled();
    });
  });

  describe('updateUserAvatar', () => {
    it('generates and persists a dicebear avatar for a MALE user', async () => {
      const user = await seedUser(getTestDb(), { gender: UserGenderEnum.MALE });

      const result = await service.updateUserAvatar(user.id);

      expect(result.image).toMatch(/api\.dicebear\.com/);
    });

    it('generates and persists a dicebear avatar for a FEMALE user', async () => {
      const user = await seedUser(getTestDb(), {
        gender: UserGenderEnum.FEMALE,
      });

      const result = await service.updateUserAvatar(user.id);

      expect(result.image).toMatch(/api\.dicebear\.com/);
    });

    it('sets a dicebear 7.x notionists avatar for an UNKNOWN user', async () => {
      const user = await seedUser(getTestDb(), {
        gender: UserGenderEnum.UNKNOWN,
      });

      const result = await service.updateUserAvatar(user.id);

      expect(result.image).toMatch(/api\.dicebear\.com\/7\.x\/notionists/);
    });

    it('calls deleteFile when the user already has an image', async () => {
      const user = await seedUser(getTestDb(), {
        image: 'https://r2.example.com/old-avatar.png',
      });

      await service.updateUserAvatar(user.id);

      expect(mockCloudflareConfig.deleteFile).toHaveBeenCalledWith(
        'https://r2.example.com/old-avatar.png',
      );
    });

    it('does not call deleteFile when the user has no image', async () => {
      const user = await seedUser(getTestDb(), { image: null });

      await service.updateUserAvatar(user.id);

      expect(mockCloudflareConfig.deleteFile).not.toHaveBeenCalled();
    });

    it('throws NotFoundException for an unknown id', async () => {
      await expect(
        service.updateUserAvatar('550e8400-e29b-41d4-a716-446655440000'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
