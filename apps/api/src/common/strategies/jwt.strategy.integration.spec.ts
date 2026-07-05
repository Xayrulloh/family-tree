/// <reference types="jest" />
import { UnauthorizedException } from '@nestjs/common';
import { seedUser } from '~/test/seeds';
import { getTestDb, truncateTables } from '~/test/test-db';
import { JwtStrategy } from './jwt.strategy';

const mockConfigService = {
  get: (_key: string) => 'test-jwt-secret',
  getOrThrow: (_key: string) => 'test-jwt-secret',
} as any;

describe('JwtStrategy (integration)', () => {
  let strategy: JwtStrategy;

  beforeAll(() => {
    strategy = new JwtStrategy(mockConfigService, getTestDb());
  });

  beforeEach(async () => {
    await truncateTables();
  });

  it('returns the user when the JWT payload email matches an existing user', async () => {
    const user = await seedUser(getTestDb(), { email: 'alice@test.com' });

    const result = await strategy.validate({
      sub: user.id,
      email: 'alice@test.com',
    } as any);

    expect(result.id).toBe(user.id);
    expect(result.email).toBe('alice@test.com');
  });

  it('throws UnauthorizedException when the email does not match any user', async () => {
    await expect(
      strategy.validate({ sub: 'unknown', email: 'ghost@test.com' } as any),
    ).rejects.toThrow(UnauthorizedException);
  });
});
