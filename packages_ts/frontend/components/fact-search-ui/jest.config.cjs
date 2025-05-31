/** @type {import('jest').Config} */
module.exports = {
  displayName: "fact-search-ui",
  preset: "ts-jest",
  testEnvironment: "jsdom",

  // Root directory for tests
  rootDir: ".",

  // Test file patterns
  testMatch: [
    "<rootDir>/src/**/__tests__/**/*.(ts|tsx|js)",
    "<rootDir>/src/**/?(*.)(spec|test).(ts|tsx|js)",
  ],

  // Module file extensions
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],

  // Transform configuration
  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        tsconfig: {
          jsx: "react-jsx",
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
        },
      },
    ],
  },

  // Module name mapping for path aliases and assets
  moduleNameMapper: {
    // Path aliases
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@shared/testing/(.*)$": "<rootDir>/../../shared/testing/$1",

    // Asset mocks
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$":
      "jest-transform-stub",

    // MUI specific mocks
    "^@mui/material$": "<rootDir>/../../shared/testing/mocks/mui",
    "^@mui/icons-material$": "<rootDir>/../../shared/testing/mocks/mui",

    // Styled components mock
    "^styled-components$": "styled-components",
  },

  // Setup files
  setupFilesAfterEnv: ["<rootDir>/src/setupTests.ts"],

  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/setupTests.ts",
    "!src/vite-env.d.ts",
    "!src/**/*.stories.{ts,tsx}",
    "!src/**/__tests__/**",
    "!src/**/test.{ts,tsx}",
    "!src/main.tsx",
    "!src/index.tsx",
  ],

  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html", "json"],

  // Coverage thresholds (initially set to 0 for setup, will be increased as tests are added)
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0,
    },
  },

  // Test environment options
  testEnvironmentOptions: {
    url: "http://localhost:3000",
  },

  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,

  // Verbose output
  verbose: true,

  // Timeout for tests
  testTimeout: 10000,

  // Module directories
  moduleDirectories: ["node_modules", "<rootDir>/src"],

  // Ignore patterns
  testPathIgnorePatterns: ["/node_modules/", "/dist/", "/build/"],

  // Watch plugins
  watchPlugins: [
    "jest-watch-typeahead/filename",
    "jest-watch-typeahead/testname",
  ],

  // Global setup/teardown
  globalSetup: undefined,
  globalTeardown: undefined,

  // Error handling
  errorOnDeprecated: true,

  // Transform ignore patterns for ES modules
  transformIgnorePatterns: [
    "node_modules/(?!(@mui|@emotion|@tanstack|grommet|styled-components)/)",
  ],
};
