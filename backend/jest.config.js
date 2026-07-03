export default {
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.ts$': ['ts-jest', { useESM: true, isolatedModules: true }],
  },
  testMatch: ['<rootDir>/tests/**/*.spec.ts'],
  clearMocks: true,
};
