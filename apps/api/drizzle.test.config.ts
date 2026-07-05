import { defineConfig } from 'drizzle-kit';

// Minimal config for test containers — reads TEST_DATABASE_URL, no full env validation needed.
export default defineConfig({
  schema: './src/database/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.TEST_DATABASE_URL!,
  },
});
