/** @type {import('jest').Config} */
module.exports = {
  displayName: 'viewfinder',
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  
  // Root directory for tests
  rootDir: '.',
  
  // Test file patterns
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.(ts|tsx|js)',
    '<rootDir>/src/**/?(*.)(spec|test).(ts|tsx|js)'
  ],
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // Transform configuration
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        module: 'esnext',
        target: 'es2020'
      }
    }]
  },
  
  // Global variables for import.meta support
  globals: {
    'import.meta': {
      env: {
        VITE_RELICA_ARCHIVIST_API_URL: 'http://localhost:3001',
        VITE_PORTAL_API_URL: 'http://localhost:3002'
      }
    }
  },
  
  // Module name mapping for path aliases and assets
  moduleNameMapper: {
    // Path aliases
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@relica/shared/testing$': '<rootDir>/../../shared/testing/index.ts',
    '^@relica/shared/testing/(.*)$': '<rootDir>/../../shared/testing/$1',
    
    // Asset mocks
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': 'jest-transform-stub',
    
    // Handle .js extensions for TypeScript files
    '^(.+)\\.js$': '$1',
    
    // Viewfinder-specific module mappings
    '^../../context/AuthContext$': '<rootDir>/src/__mocks__/AuthContext.ts',
    '^../../../../socket\\.js$': '<rootDir>/src/socket.ts',
    '^../../ui/button\\.js$': '<rootDir>/src/components/ui/button.tsx',
    
    // Three.js mocks
    '^three$': '<rootDir>/../shared/testing/mocks/three',
    '^@react-three/fiber$': '<rootDir>/../shared/testing/mocks/three',
    '^@react-three/drei$': '<rootDir>/../shared/testing/mocks/three',
    
    // MUI specific mocks
    '^@mui/material$': '<rootDir>/../shared/testing/mocks/mui',
    '^@mui/icons-material$': '<rootDir>/../shared/testing/mocks/mui',
    '^@mui/joy$': '<rootDir>/../shared/testing/mocks/mui',
    
    // Other library mocks
    '^socket\\.io-client$': '<rootDir>/../shared/testing/mocks/websocket',
    '^xterm$': 'identity-obj-proxy',
    '^xterm-addon-fit$': 'identity-obj-proxy'
  },
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/src/setupTests.ts'
  ],
  
  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/setupTests.ts',
    '!src/**/*.stories.{ts,tsx}',
    '!src/**/__tests__/**',
    '!src/**/test.{ts,tsx}',
    '!src/index.tsx',
    '!src/xterm.jsx'
  ],
  
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  
  // Coverage thresholds (initially set to 0 for setup, will be increased as tests are added)
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0
    }
  },
  
  // Test environment options
  testEnvironmentOptions: {
    url: 'http://localhost:3000'
  },
  
  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,
  
  // Verbose output
  verbose: true,
  
  // Timeout for tests
  testTimeout: 10000,
  
  // Module directories
  moduleDirectories: ['node_modules', '<rootDir>/src'],
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/'
  ],
  
  // Watch plugins
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname'
  ],
  
  // Global setup/teardown
  globalSetup: undefined,
  globalTeardown: undefined,
  
  // Error handling
  errorOnDeprecated: true,
  
  // Transform ignore patterns for ES modules
  transformIgnorePatterns: [
    'node_modules/(?!(three|@react-three|@mui|@emotion|@tanstack|socket\\.io-client|d3|ag-grid-react|react-admin)/)'
  ]
};