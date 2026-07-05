/// <reference types="jest" />
import { envSchema } from './env-validation';

const VALID_ENV = {
  DATABASE_URL: 'postgres://user:pass@localhost:5432/db',
  PORT: '3000',
  NODE_ENV: 'test',
  GOOGLE_CLIENT_ID: 'client-id',
  GOOGLE_CLIENT_SECRET: 'client-secret',
  GOOGLE_CALLBACK_URL: 'http://localhost:3000/api/auth/google/callback',
  JWT_SECRET: 'jwt-secret',
  COOKIES_SECRET: 'cookies-secret',
  CLOUDFLARE_URL: 'https://cdn.example.com',
  CLOUDFLARE_ENDPOINT: 'https://r2.example.com',
  CLOUDFLARE_ACCESS_KEY_ID: 'access-key',
  CLOUDFLARE_SECRET_ACCESS_KEY: 'secret-key',
  SENTRY_DSN: 'https://sentry.example.com/1',
  REDIS_URL: 'redis://localhost:6379',
  REDIS_TTL: '60000',
  COOKIE_DOMAIN: 'localhost',
  COOKIE_CLIENT_URL: 'http://localhost:4200',
};

describe('envSchema', () => {
  it('accepts a complete valid environment', () => {
    expect(envSchema.safeParse(VALID_ENV).success).toBe(true);
  });

  it('transforms PORT from string to number', () => {
    const result = envSchema.parse(VALID_ENV);

    expect(result.PORT).toBe(3000);
  });

  it('transforms REDIS_TTL from string to number', () => {
    const result = envSchema.parse(VALID_ENV);

    expect(result.REDIS_TTL).toBe(60000);
  });

  it('rejects a PORT that is not exactly 4 characters', () => {
    expect(envSchema.safeParse({ ...VALID_ENV, PORT: '80' }).success).toBe(
      false,
    );

    expect(envSchema.safeParse({ ...VALID_ENV, PORT: '30000' }).success).toBe(
      false,
    );
  });

  it('rejects an invalid DATABASE_URL', () => {
    expect(
      envSchema.safeParse({ ...VALID_ENV, DATABASE_URL: 'not-a-url' }).success,
    ).toBe(false);
  });

  it('rejects an empty JWT_SECRET', () => {
    expect(envSchema.safeParse({ ...VALID_ENV, JWT_SECRET: '' }).success).toBe(
      false,
    );
  });

  it('rejects when a required variable is missing', () => {
    const { REDIS_URL: _r, ...rest } = VALID_ENV;

    expect(envSchema.safeParse(rest).success).toBe(false);
  });
});
