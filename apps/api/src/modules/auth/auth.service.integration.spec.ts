/// <reference types="jest" />
import { UserGenderEnum } from '@family-tree/shared';
import { BadRequestException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import * as schema from '~/database/schema';
import { seedUser } from '~/test/seeds';
import { getTestDb, truncateTables } from '~/test/test-db';
import { AuthService } from './auth.service';

const mockJwtService = {
  signAsync: jest.fn().mockResolvedValue('signed-jwt-token'),
};

const googleUser = {
  id: 'google-oauth-id',
  email: 'newcomer@test.com',
  name: 'New Comer',
  image: 'https://example.com/avatar.png',
  gender: UserGenderEnum.MALE,
};

describe('AuthService (integration)', () => {
  let service: AuthService;

  beforeAll(() => {
    service = new AuthService(mockJwtService as any, getTestDb());
  });

  beforeEach(async () => {
    jest.resetAllMocks();
    mockJwtService.signAsync.mockResolvedValue('signed-jwt-token');
    await truncateTables();
  });

  describe('signIn', () => {
    it('returns a JWT for an existing user without creating a new row', async () => {
      const user = await seedUser(getTestDb(), { email: 'existing@test.com' });

      const token = await service.signIn({ email: 'existing@test.com' } as any);

      expect(token).toBe('signed-jwt-token');
      expect(mockJwtService.signAsync).toHaveBeenCalledWith({
        sub: user.id,
        email: 'existing@test.com',
      });

      const all = await getTestDb().query.usersSchema.findMany();

      expect(all).toHaveLength(1);
    });

    it('registers a new user when the email is unknown', async () => {
      const token = await service.signIn(googleUser as any);

      expect(token).toBe('signed-jwt-token');

      const created = await getTestDb().query.usersSchema.findFirst({
        where: eq(schema.usersSchema.email, 'newcomer@test.com'),
      });

      expect(created).toBeDefined();
      expect(created?.username).toBe('newcomer-google-oauth-id');
    });

    it('throws BadRequestException when the email is missing', async () => {
      await expect(service.signIn({} as any)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('registerUser', () => {
    it('creates a user with the derived username and returns a JWT', async () => {
      const token = await service.registerUser(googleUser as any);

      expect(token).toBe('signed-jwt-token');

      const created = await getTestDb().query.usersSchema.findFirst({
        where: eq(schema.usersSchema.email, 'newcomer@test.com'),
      });

      expect(created?.name).toBe('New Comer');
      expect(created?.gender).toBe(UserGenderEnum.MALE);
    });

    it('throws BadRequestException when the email is missing', async () => {
      await expect(service.registerUser({} as any)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
