import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          allowJs: true,
          esModuleInterop: true,
        }
      },
    ],
  },
  moduleNameMapper: {
    '^zkcloudworker$': '<rootDir>/tests/__mocks__/zkcloudworker.ts'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(o1js)/.*)',
  ],
  slowTestThreshold: 1500,
  testTimeout: 10800000,
  verbose: true,
  roots: ['tests'],
};

export default config; 