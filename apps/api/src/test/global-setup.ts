import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PostgreSqlContainer } from '@testcontainers/postgresql';

export const CONTAINER_INFO_PATH = join(
  tmpdir(),
  'family-tree-test-container.json',
);

// apps/api/ — two levels up from src/test/
const API_ROOT = join(__dirname, '../..');

export default async function globalSetup() {
  const container = await new PostgreSqlContainer('postgres:16-alpine')
    .withDatabase('family_tree_test')
    .withUsername('test')
    .withPassword('test')
    .start();

  const url = container.getConnectionUri();

  // Propagate to worker processes (inherited by child processes from parent env)
  process.env.TEST_DATABASE_URL = url;

  // Persist container ID so globalTeardown (different process) can stop it
  writeFileSync(
    CONTAINER_INFO_PATH,
    JSON.stringify({ id: container.getId(), url }),
  );

  // Push schema directly — avoids broken FK chains in the migration history
  execSync(
    'pnpm exec drizzle-kit push --force --config drizzle.test.config.ts',
    {
      cwd: API_ROOT,
      env: { ...process.env, TEST_DATABASE_URL: url },
      stdio: 'pipe',
    },
  );
}
