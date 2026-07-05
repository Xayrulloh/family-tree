import type { Config } from 'jest';
import { baseConfig } from './jest.base.ts';

const config: Config = {
  ...baseConfig,
  displayName: 'api-e2e',
  testMatch: ['**/*.e2e.spec.ts'],
  testTimeout: 60000,
  globalSetup: '<rootDir>/src/test/global-setup.e2e.ts',
  globalTeardown: '<rootDir>/src/test/global-teardown.e2e.ts',
  setupFilesAfterEnv: ['<rootDir>/src/test/setup-after-env.ts'],
  maxWorkers: 1,
};

export default config;
