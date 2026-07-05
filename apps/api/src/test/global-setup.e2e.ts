import { execSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PostgreSqlContainer } from '@testcontainers/postgresql';

export const E2E_CONTAINER_INFO_PATH = join(
  tmpdir(),
  `family-tree-e2e-containers-${randomUUID().slice(0, 8)}.json`,
);

const API_ROOT = join(__dirname, '../..');

export default async function globalSetupE2E() {
  const pgContainer = await new PostgreSqlContainer('postgres:16-alpine')
    .withDatabase('family_tree_e2e')
    .withUsername('test')
    .withPassword('test')
    .start();

  const dbUrl = pgContainer.getConnectionUri();

  process.env.DATABASE_URL = dbUrl;
  process.env.TEST_DATABASE_URL = dbUrl;
  // REDIS_URL must pass Zod validation — the actual Redis client is overridden
  // in createE2EApp via Test.createTestingModule so no real connection is made.
  process.env.REDIS_URL = 'redis://localhost:6379';
  process.env.REDIS_TTL = '60000';
  process.env.PORT = '3001';
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'e2e-test-jwt-secret';
  process.env.COOKIES_SECRET = 'e2e-test-cookies-secret';
  process.env.GOOGLE_CLIENT_ID = 'fake-google-client-id';
  process.env.GOOGLE_CLIENT_SECRET = 'fake-google-client-secret';
  process.env.GOOGLE_CALLBACK_URL =
    'http://localhost:3001/api/auth/google/callback';
  process.env.CLOUDFLARE_URL = 'https://fake.cloudflare.test';
  process.env.CLOUDFLARE_ENDPOINT = 'https://fake.cloudflare.test/endpoint';
  process.env.CLOUDFLARE_ACCESS_KEY_ID = 'fake-key-id';
  process.env.CLOUDFLARE_SECRET_ACCESS_KEY = 'fake-secret-key';
  process.env.SENTRY_DSN = 'https://fake@o0.ingest.sentry.io/0';
  process.env.COOKIE_DOMAIN = 'localhost';
  process.env.COOKIE_CLIENT_URL = 'http://localhost:4200';

  writeFileSync(
    E2E_CONTAINER_INFO_PATH,
    JSON.stringify({ pgId: pgContainer.getId() }),
  );

  // Pass the run-unique path to globalTeardown (different Node process).
  process.env.E2E_CONTAINER_INFO_FILE = E2E_CONTAINER_INFO_PATH;

  try {
    execSync(
      'pnpm exec drizzle-kit push --force --config drizzle.test.config.ts',
      {
        cwd: API_ROOT,
        env: { ...process.env, TEST_DATABASE_URL: dbUrl },
        stdio: 'pipe',
      },
    );
  } catch (err) {
    await pgContainer.stop();

    throw err;
  }
}
