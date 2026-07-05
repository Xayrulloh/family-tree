import type { Config } from 'jest';
import { baseConfig } from './jest.base.ts';

const config: Config = {
  ...baseConfig,
  displayName: 'api',
  coverageDirectory: '../../coverage/apps/api',
  coverageReporters: ['lcov', 'text-summary'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '\\.integration\\.spec\\.ts$',
    '\\.e2e\\.spec\\.ts$',
  ],
};

export default config;
