module.exports = {
  apps: [
    {
      name: 'portal',
      script: 'packages/portal/dist/main.js',
      cwd: '/usr/src/app',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 2204,
        // Service discovery - all services on localhost
        ARCHIVIST_HOST: 'localhost',
        ARCHIVIST_PORT: 3000,
        CLARITY_HOST: 'localhost',
        CLARITY_PORT: 3001,
        APERTURE_HOST: 'localhost',
        APERTURE_PORT: 3002,
        SHUTTER_HOST: 'localhost',
        SHUTTER_PORT: 3004,
        PRISM_HOST: 'localhost',
        PRISM_PORT: 3005,
        NOUS_HOST: 'localhost',
        NOUS_PORT: 3006
      }
    },
    {
      name: 'archivist',
      script: 'packages/archivist/dist/main.js',
      cwd: '/usr/src/app',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        // Database connections (still via container names)
        REDIS_URL: 'redis://redis:6379',
        REDIS_PASSWORD: 'redis',
        NEO4J_HOST: 'neo4j',
        NEO4J_PORT: 7687,
        NEO4J_USER: 'neo4j',
        NEO4J_PASSWORD: 'password',
        POSTGRES_HOST: 'postgres',
        POSTGRES_PORT: 5432,
        POSTGRES_USER: 'postgres',
        POSTGRES_PASSWORD: 'password',
        POSTGRES_DB: 'postgres'
      }
    },
    {
      name: 'clarity',
      script: 'packages/clarity/dist/main.js',
      cwd: '/usr/src/app',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        // Database connections
        POSTGRES_HOST: 'postgres',
        POSTGRES_PORT: 5432,
        POSTGRES_USER: 'postgres',
        POSTGRES_PASSWORD: 'password',
        POSTGRES_DB: 'postgres',
        // Service connections - localhost
        ARCHIVIST_HOST: 'localhost',
        ARCHIVIST_PORT: 3000
      }
    },
    {
      name: 'aperture',
      script: 'packages/aperture/dist/main.js',
      cwd: '/usr/src/app',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        APERTURE_PORT: 3002,
        PORT: 3002,
        // Database connections
        DB_HOST: 'postgres',
        DB_PORT: 5432,
        DB_USERNAME: 'postgres',
        DB_PASSWORD: 'password',
        DB_DATABASE: 'postgres',
        // Service connections - localhost
        ARCHIVIST_HOST: 'localhost',
        ARCHIVIST_PORT: 3000
      }
    },
    {
      name: 'shutter',
      script: 'packages/shutter/dist/main.js',
      cwd: '/usr/src/app',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '256M',
      env: {
        NODE_ENV: 'production',
        PORT: 3004,
        // Database connections
        POSTGRES_HOST: 'postgres',
        POSTGRES_PORT: 5432,
        POSTGRES_USER: 'postgres',
        POSTGRES_PASSWORD: 'password',
        POSTGRES_DB: 'postgres',
        JWT_SECRET: 'development-secret-change-in-production'
      }
    },
    {
      name: 'prism',
      script: 'packages/prism/dist/main.js',
      cwd: '/usr/src/app',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PRISM_PORT: 3005,
        PORT: 3005,
        // Database connections
        NEO4J_URI: 'bolt://neo4j:7687',
        NEO4J_USER: 'neo4j',
        NEO4J_PASSWORD: 'password',
        REDIS_URL: 'redis://redis:6379',
        REDIS_PASSWORD: 'redis',
        POSTGRES_HOST: 'postgres',
        POSTGRES_PORT: 5432,
        POSTGRES_USER: 'postgres',
        POSTGRES_PASSWORD: 'password',
        POSTGRES_DB: 'postgres',
        // File paths
        PRISM_SEED_XLS_DIR: '/usr/src/app/seed_xls',
        PRISM_CSV_OUTPUT_DIR: '/usr/src/app/seed_csv',
        PRISM_NEO4J_IMPORT_DIR: '/var/lib/neo4j/import',
        // Service connections - localhost
        ARCHIVIST_URL: 'http://localhost:3000',
        ARCHIVIST_HOST: 'localhost',
        ARCHIVIST_PORT: 3000
      }
    },
    {
      name: 'nous',
      script: 'packages_py/nous/main.py',
      interpreter: 'python3',
      cwd: '/usr/src/app',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        PORT: 3006,
        PYTHONPATH: '/usr/src/app',
        PYTHONUNBUFFERED: '1',
        // Service connections - localhost
        CLARITY_HOST: 'localhost',
        CLARITY_PORT: 3001,
        APERTURE_HOST: 'localhost',
        APERTURE_PORT: 3002,
        ARCHIVIST_HOST: 'localhost',
        ARCHIVIST_PORT: 3000,
        // API Keys (to be set via docker-compose environment)
        OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
        ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
        GROQ_API_KEY: process.env.GROQ_API_KEY || ''
      }
    }
  ]
};