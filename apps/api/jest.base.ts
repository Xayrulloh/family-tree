import type { Config } from 'jest';

/**
 * Settings shared by jest.config.ts, jest.integration.config.ts, and
 * jest.e2e.config.ts so path aliases and transforms can't drift apart.
 */
export const baseConfig: Config = {
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleNameMapper: {
    '^@family-tree/shared$': '<rootDir>/../../libs/shared/src/index.ts',
    '^~/(.*)$': '<rootDir>/src/$1',
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
};
