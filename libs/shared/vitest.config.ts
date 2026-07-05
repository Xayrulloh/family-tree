import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.{ts,js}'],
    coverage: {
      reportsDirectory: '../../coverage/libs/shared',
      provider: 'v8',
      reporter: ['lcov', 'text-summary'],
    },
  },
});
