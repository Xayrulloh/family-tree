/// <reference types="jest" />
import { eq } from 'drizzle-orm';
import * as schema from '~/database/schema';
import { seedUser } from '~/test/seeds';
import { getTestDb, truncateTables } from '~/test/test-db';
import { GoogleStrategy } from './google.strategy';

const mockConfigService = {
  getOrThrow: (key: string) => `test-${key}`,
  get: (key: string) => `test-${key}`,
} as any;

function makeProfile(
  overrides: Partial<{
    id: string;
    emails: { value: string; type: string }[];
    name: { givenName: string; familyName: string };
    photos: { value: string; type: string }[];
  }> = {},
) {
  return {
    id: 'google-123',
    emails: [{ value: 'user@test.com', type: '' }],
    name: { givenName: 'Test', familyName: 'User' },
    photos: [{ value: 'https://example.com/photo.jpg', type: '' }],
    ...overrides,
  };
}

describe('GoogleStrategy (integration)', () => {
  let strategy: GoogleStrategy;

  beforeAll(() => {
    strategy = new GoogleStrategy(mockConfigService, getTestDb());
  });

  beforeEach(async () => {
    await truncateTables();
  });

  describe('validate — existing user', () => {
    it('returns the existing user without creating a new row', async () => {
      const existing = await seedUser(getTestDb(), { email: 'user@test.com' });
      const done = jest.fn();

      await strategy.validate('token', 'refresh', makeProfile(), done);

      expect(done).toHaveBeenCalledWith(
        null,
        expect.objectContaining({ id: existing.id }),
      );

      const all = await getTestDb().query.usersSchema.findMany();

      expect(all).toHaveLength(1);
    });
  });

  describe('validate — new user', () => {
    it('creates a user row with the derived username', async () => {
      const done = jest.fn();

      await strategy.validate('token', 'refresh', makeProfile(), done);

      const created = await getTestDb().query.usersSchema.findFirst({
        where: eq(schema.usersSchema.email, 'user@test.com'),
      });

      expect(created).toBeDefined();
      expect(created?.username).toBe('user-google-123');
      expect(created?.name).toBe('Test User');
    });

    it('also creates a default notification_reads row for the new user', async () => {
      const done = jest.fn();

      await strategy.validate('token', 'refresh', makeProfile(), done);

      const user = await getTestDb().query.usersSchema.findFirst({
        where: eq(schema.usersSchema.email, 'user@test.com'),
      });

      const readRow = await getTestDb().query.notificationReadsSchema.findFirst(
        {
          where: eq(schema.notificationReadsSchema.userId, user!.id),
        },
      );

      expect(readRow).toBeDefined();
    });

    it('uses the profile photo as the avatar when provided', async () => {
      const done = jest.fn();

      await strategy.validate('token', 'refresh', makeProfile(), done);

      const user = await getTestDb().query.usersSchema.findFirst({
        where: eq(schema.usersSchema.email, 'user@test.com'),
      });

      expect(user?.image).toBe('https://example.com/photo.jpg');
    });

    it('falls back to a DiceBear URL when the profile photo is empty', async () => {
      const done = jest.fn();

      await strategy.validate(
        'token',
        'refresh',
        makeProfile({ photos: [{ value: '', type: '' }] }),
        done,
      );

      const user = await getTestDb().query.usersSchema.findFirst({
        where: eq(schema.usersSchema.email, 'user@test.com'),
      });

      expect(user?.image).toMatch(/dicebear\.com/);
    });

    it('passes the created user to done', async () => {
      const done = jest.fn();

      await strategy.validate('token', 'refresh', makeProfile(), done);

      expect(done).toHaveBeenCalledWith(
        null,
        expect.objectContaining({ email: 'user@test.com' }),
      );
    });
  });
});
