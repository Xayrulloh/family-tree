import type { Config } from 'jest';
import { baseConfig } from './jest.base.ts';

const config: Config = {
  ...baseConfig,
  displayName: 'api-integration',
  testMatch: ['**/*.integration.spec.ts'],
  testTimeout: 60000,
  globalSetup: '<rootDir>/src/test/global-setup.ts',
  globalTeardown: '<rootDir>/src/test/global-teardown.ts',
  setupFilesAfterEnv: ['<rootDir>/src/test/setup-after-env.ts'],
  maxWorkers: 1,
};

export default config;
