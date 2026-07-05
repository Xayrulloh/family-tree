/// <reference types='vitest' />

import path from 'node:path';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// Separate from the inferred unit-test config: runs only `*.integration.spec.ts`
// with the MSW server wired up. Keeps `nx test web` unit-only.
export default defineConfig({
  root: __dirname,
  resolve: {
    alias: {
      '~': path.resolve(__dirname, 'src'),
    },
  },
  cacheDir: '../../node_modules/.vite/apps/web-integration',
  plugins: [react(), nxViteTsPaths()],
  test: {
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.integration.spec.ts'],
    setupFiles: ['src/test/setup-integration.ts'],
    env: {
      VITE_API_URL: 'http://api.test',
    },
    reporters: ['default'],
    coverage: {
      // Always on: CI's `nx affected -t test-integration` runs without
      // --coverage, and Sonar merges this lcov with the unit one.
      enabled: true,
      reportsDirectory: '../../coverage/apps/web-integration',
      provider: 'v8',
      reporter: ['lcov', 'text-summary'],
    },
  },
});
